import axios from "axios";
import type { Count, Device, DeviceData } from "./utils/types.js"
import fs from "fs";
import cron from "node-cron";
import path from "path";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";
import vm from "vm";
import dotenv from "dotenv";

dotenv.config();

const dashboards = [
    {
        dashboardId: "6bc4f470-b8b0-11f0-9390-491b8af3915c",
        devices: [
            {
                deviceId: "071d8d00-9d5a-11f0-9390-491b8af3915c",
                name: "Milesight-WTS-031890",
                keys: ["temperatureChannel0_c", "humidityChannel0_pct", "windSpeed_m_s", "windDirection_grades", "pressure_hpa", "rainfallTotal_mm"]
            },
            {
                deviceId: "fa126150-a81a-11f0-9390-491b8af3915c",
                name: "Dragino-PSLB-888154",
                keys: ["h2s_ppm"]
            },
            {
                deviceId: "880b3fa0-a81a-11f0-9390-491b8af3915c",
                name: "Dragino-PSLB-888152",
                keys: ["h2s_ppm"]
            },
            {
                deviceId: "6d8368b0-a81a-11f0-9390-491b8af3915c",
                name: "Dragino-PSLB-88814F",
                keys: ["h2s_ppm"]
            },
            {
                deviceId: "7a1a03d0-9d5d-11f0-9390-491b8af3915c",
                name: "Synetica-OAQ-29653A",
                keys: ["h2s_ppm"]
            }
        ],
        historicalDevices: [
          {
            deviceId: "fa126150-a81a-11f0-9390-491b8af3915c",
            name: "Dragino-PSLB-888154",
            keys: ["h2s_ppm"]
          },
          {
            deviceId: "880b3fa0-a81a-11f0-9390-491b8af3915c",
            name: "Dragino-PSLB-888152",
            keys: ["h2s_ppm"]
          },
          {
            deviceId: "6d8368b0-a81a-11f0-9390-491b8af3915c",
            name: "Dragino-PSLB-88814F",
            keys: ["h2s_ppm"]
          },
          {
            deviceId: "7a1a03d0-9d5d-11f0-9390-491b8af3915c",
            name: "Synetica-OAQ-29653A",
            keys: ["h2s_ppm"]
          }
        ],
        counts: [
          {
            key: "assignedBadges",
            body: {
              entityFilter: {
                type: "relationsQuery",
                rootEntity: {
                  entityType: "CUSTOMER",
                  id: "ce21f2e0-83c6-11f0-898c-f5f39148edb0"
                },
                direction: "FROM",
                filters: [
                  {
                    relationType: "deviceToMachine",
                    entityTypes: ["DEVICE"]
                  }
                ]
              },
              keyFilters: [
                {
                  key: { type: "ENTITY_FIELD", key: "type" },
                  valueType: "STRING",
                  predicate: {
                    operation: "EQUAL",
                    value: { defaultValue: "motion-tracking-devices" },
                    type: "STRING"
                  }
                },
                {
                  key: { type: "ENTITY_FIELD", key: "name" },
                  valueType: "STRING",
                  predicate: {
                    operation: "NOT_EQUAL",
                    value: { defaultValue: "Abeeway-SMARTBADGE-00113F" },
                    ignoreCase: true,
                    type: "STRING"
                  }
                },
                {
                  key: { type: "TIME_SERIES", key: "zoneCurrentNamed" },
                  valueType: "STRING",
                  predicate: {
                    operation: "NOT_EQUAL",
                    value: { defaultValue: "[01] NOT- DEFINIED" },
                    ignoreCase: true,
                    type: "STRING"
                  }
                },
                {
                  key: { type: "ATTRIBUTE", key: "relatedMachineDisplayName" },
                  valueType: "STRING",
                  predicate: {
                    operation: "NOT_CONTAINS",
                    value: { defaultValue: "ENI_" },
                    type: "STRING"
                  }
                }
              ],
              pageLink: {
                page: 0,
                pageSize: 200,
                sortOrder: {
                  key: { key: "name", type: "ENTITY_FIELD" },
                  direction: "ASC"
                }
              }
            }
          },
          {
            key: "totalBadges",
            body: {
              entityFilter: {
                type: "relationsQuery",
                rootEntity: {
                  entityType: "CUSTOMER",
                  id: "ce21f2e0-83c6-11f0-898c-f5f39148edb0"
                },
                direction: "FROM",
                filters: [
                  {
                    relationType: "Contains",
                    entityTypes: ["DEVICE"]
                  }
                ]
              },
              keyFilters: [
                {
                  key: { type: "ENTITY_FIELD", key: "type" },
                  valueType: "STRING",
                  predicate: {
                    operation: "EQUAL",
                    value: { defaultValue: "motion-tracking-devices" },
                    type: "STRING"
                  }
                },
                {
                  key: { type: "ENTITY_FIELD", key: "name" },
                  valueType: "STRING",
                  predicate: {
                    operation: "NOT_EQUAL",
                    value: { defaultValue: "Abeeway-SMARTBADGE-00113F" },
                    ignoreCase: true,
                    type: "STRING"
                  }
                }
              ],
              pageLink: {
                page: 0,
                pageSize: 200,
                sortOrder: {
                  key: { key: "name", type: "ENTITY_FIELD" },
                  direction: "ASC"
                }
              }
            }
          }
        ],
        emails: process.env.RECEIVER_EMAILS!,
        crons: [
          { expression : "0 8 * * *", reportType: "Morning Shift Report"},
          { expression : "0 0 0 * * *", reportType: "Night Shift Report"}
        ],
        template: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 40px;
        background: #f8f8fc;
        color: #333;
      }

      h1 {
        color: #4B0082;
        text-align: center;
        font-size: 28px;
        margin-bottom: 0;
      }

      h3 {
        text-align: center;
        color: #4B0082;
        margin-top: 5px;
        font-weight: 600;
      }

      h2 {
        color: #4B0082;
        margin-top: 50px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }

      th {
        background: #5b1aa8;
        color: white;
        padding: 8px;
        text-align: left;
        font-size: 13px;
      }

      td {
        padding: 8px;
        border: 1px solid #ddd;
        font-size: 12px;
      }

      tr:nth-child(even) {
        background: #f6edfb;
      }

      .report-info {
        margin: 40px auto;
        border-collapse: collapse;
        width: 100%;
      }

      .report-info tr {
        border: none;
        text-align: left;
      }

      .report-info td {
        padding: auto;
        border: none;
        text-align: left;
      }

      .report-info .label {
        font-weight: 400;
        font-size: 12px;
        width: 220px;
        padding: auto;
      }

      .report-info .value {
        font-size: 12px;
        color: #000;
        font-weight: 500;
      }

      .label {
        font-weight: bold;
        color: #4B0082;
        width: 150px;
      }

      .summary-box {
        background: #f3e9f9;
        font-weight: bold;
      }

      .summary-box-table tr {
        width: 100%;
        border-collapse: collapse;
        border: none;
      }
      
      .summary-box-label {
        font-size: 13px;
        font-weight: bold;
        text-color: #000;
        padding: auto;
      }

      .summary-box tr{
        border: none;
        text-align: left;
      } 

      .safe {
        color: green;
        font-weight: bold;
      }

      .unsafe {
        color: red;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div style="text-align: center; margin-bottom: 15px; display: flex; flex-direction: column; align-items: center;">
      <img
        src="https://res.cloudinary.com/dwfqmux0y/image/upload/v1762529744/Senzary_logo_new_uqpei8.png"
        alt="Company Logo"
        style="width: 120px; height: auto;"
      />
      <a href="https://iotlogiq.com" target="_blank" style="margin-top: 5px; font-size: 6px; color: #4B0082; text-decoration: none; underline: none;">
        <button style="background-color: #4B0082; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">Go to IoTLogiQ</button>
      </a>
    </div>
    <!-- Header Section -->
    <h1>Environmental Safety Monitoring Report</h1>
    <h3>{{shiftName}}</h3>

    <table class="report-info">
      <tr>
        <td class="label">Report Date:</td>
        <td>{{reportDate}}</td>
      </tr>
      <tr>
        <td class="label">Report Time:</td>
        <td>{{reportTime}} (Mexico Local Time)</td>
      </tr>
      <tr>
        <td class="label">Report Type:</td>
        <td>{{reportType}}</td>
      </tr>
    </table>

    <h2>Executive Summary</h2>
    <table class="summary-box-table">
      <tr>
        <td class="summary-box-label">Overall Status:</td>
        <td>{{overallStatus}}</td>
      </tr>
      <tr>
        <td class="summary-box-label">Badge Assignment:</td>
        <td>{{assignedBadges}}/{{totalBadges}}</td>
      </tr>
    </table>

    <h2>■■ Weather Station</h2>
    <table>
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Value</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Temperature</td>
          <td>{{Milesight-WTS-031890.temperatureChannel0_c}}°C</td>
          <td>
            {{if data["Milesight-WTS-031890"].temperatureChannel0_c < 18 ? "Cool" : data["Milesight-WTS-031890"].temperatureChannel0_c < 26 ? "Good" : "Hot"}}
          </td>
        </tr>
        <tr>
          <td>Humidity</td>
          <td>{{Milesight-WTS-031890.humidityChannel0_pct}}%</td>
          <td>
            {{if data["Milesight-WTS-031890"].humidityChannel0_pct < 30 ? "Low" : data["Milesight-WTS-031890"].humidityChannel0_pct < 60 ? "Moderate" : "High"}}
          </td>
        </tr>
        <tr>
          <td>Wind Speed</td>
          <td>{{Milesight-WTS-031890.windSpeed_m_s}} m/s</td>
          <td>
            {{if data["Milesight-WTS-031890"].windSpeed_m_s < 1 ? "Calm" : data["Milesight-WTS-031890"].windSpeed_m_s < 5 ? "Breeze" : data["Milesight-WTS-031890"].windSpeed_m_s < 10 ? "Windy" : "Strong"}}
          </td>
        </tr>
        <tr>
          <td>Wind Direction</td>
          <td>{{Milesight-WTS-031890.windDirection_grades}}°</td>
          <td>
            {{if (data["Milesight-WTS-031890"].windDirection_grades < 10 || data["Milesight-WTS-031890"].windDirection_grades >= 315) ? "North" : (data["Milesight-WTS-031890"].windDirection_grades >= 45 && data["Milesight-WTS-031890"].windDirection_grades < 315) ? "East" : (data["Milesight-WTS-031890"].windDirection_grades >= 135 && data["Milesight-WTS-031890"].windDirection_grades < 225) ? "South" : "West"}}
          </td>
        </tr>
        <tr>
          <td>Pressure</td>
          <td>{{Milesight-WTS-031890.pressure_hpa}} hPa</td>
          <td>
            {{if data["Milesight-WTS-031890"].pressure_hpa < 1000 ? "Low" : data["Milesight-WTS-031890"].pressure_hpa < 1025 ? "Stable" : "High"}}
          </td>
        </tr>
        <tr>
          <td>Rainfall</td>
          <td>{{Milesight-WTS-031890.rainfallTotal_mm}} mm</td>
          <td>
            {{if (data["Milesight-WTS-031890"].rainfallTotal_mm === 0 || data["Milesight-WTS-031890"].rainfallTotal_mm < 0.5) ? "Dry" : data["Milesight-WTS-031890"].rainfallTotal_mm < 2.5 ? "Light" : data["Milesight-WTS-031890"].rainfallTotal_mm < 7.5 ? "Moderate" : "Heavy"}}
          </td>
        </tr>
      </tbody>
    </table>

    <h2>■ H2S Sensor Monitoring</h2>
    <table>
      <thead>
        <tr>
          <th>Location</th>
          <th>Current Level (ppm)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>DOCK 4 AND 5</td>
          <td>{{Dragino-PSLB-88814F.h2s_ppm}} ppm</td>
          <td>
            {{if data["Dragino-PSLB-88814F"].h2s_ppm < 5 ? "Safe" : data["Dragino-PSLB-88814F"].h2s_ppm < 10 ? "Warning" : "Critical"}}
          </td>
        </tr>
        <tr>
          <td>PIPE YARD</td>
          <td>{{Synetica-OAQ-29653A.h2s_ppm}} ppm</td>
          <td>
            {{if data["Synetica-OAQ-29653A"].h2s_ppm < 5 ? "Safe" : data["Synetica-OAQ-29653A"].h2s_ppm < 10 ? "Warning" : "Critical"}}
          </td>
        </tr>
        <tr>
          <td>PARKING ZONE</td>
          <td>{{Dragino-PSLB-888152.h2s_ppm}} ppm</td>
          <td>
            {{if data["Dragino-PSLB-888152"].h2s_ppm < 5 ? "Safe" : data["Dragino-PSLB-888152"].h2s_ppm < 10 ? "Warning" : "Critical"}}
          </td>
        </tr>
        <tr>
          <td>DOCK 3</td>
          <td>{{Dragino-PSLB-888154.h2s_ppm}} ppm</td>
          <td>
            {{if data["Dragino-PSLB-888154"].h2s_ppm < 5 ? "Safe" : data["Dragino-PSLB-888154"].h2s_ppm < 10 ? "Warning" : "Critical"}}
          </td>
        </tr>
      </tbody>
    </table>
    <h2>■ 24-Hour Historical Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Location</th>
          <th>Min (ppm)</th>
          <th>Max (ppm)</th>
          <th>Avg (ppm)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>DOCK 4 AND 5</td>
          <td>{{Historical-Dragino-PSLB-88814F.min}} ppm</td>
          <td>{{Historical-Dragino-PSLB-88814F.max}} ppm</td>
          <td>{{Historical-Dragino-PSLB-88814F.avg}} ppm</td>
        </tr>
        <tr>
          <td>PIPE YARD</td>
          <td>{{Historical-Synetica-OAQ-29653A.min}} ppm</td>
          <td>{{Historical-Synetica-OAQ-29653A.max}} ppm</td>
          <td>{{Historical-Synetica-OAQ-29653A.avg}} ppm</td>
        </tr>
        <tr>
          <td>PARKING ZONE</td>
          <td>{{Historical-Dragino-PSLB-888152.min}} ppm</td>
          <td>{{Historical-Dragino-PSLB-888152.max}} ppm</td>
          <td>{{Historical-Dragino-PSLB-888152.avg}} ppm</td>
        </tr>
        <tr>
          <td>DOCK 3</td>
          <td>{{Historical-Dragino-PSLB-888154.min}} ppm</td>
          <td>{{Historical-Dragino-PSLB-888154.max}} ppm</td>
          <td>{{Historical-Dragino-PSLB-888154.avg}} ppm</td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`
    },
]

export async function loginThingsBoard(): Promise<string> {
    try {
        const response = await axios.post(`${process.env.IOT_LOGIQ_URL}/api/auth/login`, {
            username: process.env.IOT_LOGIQ_USERNAME!,
            password: process.env.IOT_LOGIQ_PASSWORD!
        });
        return response.data.token;
    } catch (err: any) {
        console.error("Login failed:", err.response?.data || err.message);
        throw err;
    }
}

function fillTemplate(template: string, data: Record<string, string>) {
    template = template.replace(/{{([\w.-]+)}}/g, (_, path) => {
        const keys = path.split(".");
        let value: any = data;
        for (const key of keys) {
            value = value?.[key];
            if (value === undefined) return "";
        }
        return String(value);
    });

    template = template.replace(/{{if ([^}]+)}}/g, (_, expression) => {
        try {
            const sandbox = { data };
            const result = vm.runInNewContext(expression, sandbox);
            return result ?? "";
        } catch (err) {
            console.log("Error evaluating expression:", expression, err);
            return "";
        }
    });

    return template;
}

async function generatePdfFromTemplate(dashboardId: string, deviceData: any, templateHtml: string): Promise<string> {
  const filledHtml = fillTemplate(templateHtml, deviceData);

  const outputDir = path.resolve("reports");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const existingFiles = fs.readdirSync(outputDir);
  for (const file of existingFiles) {
    if (file.endsWith(".pdf")) {
      fs.unlinkSync(path.join(outputDir, file));
    }
  }

  const outputPath = path.join(outputDir, "Environmental_Safety_Report.pdf");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(filledHtml, { waitUntil: "networkidle0" });
  await page.pdf({ path: outputPath, format: "A4", printBackground: true });
  await browser.close();

  return outputPath;
}

async function fetchMultiDeviceTelemetry(devices: Device[], historicalDevices: Device[], counts: Count[]): Promise<any> {
    const token = await loginThingsBoard();
    const results: Record<string, any> = {};
    const roundTo = (num: number | string, decimals: number = 5): number => {
      const parsed = typeof num === "string" ? Number(num) : num;
      if (isNaN(parsed)) return NaN;
      const factor = 10 ** decimals;
      return parseFloat((Math.round(parsed * factor) / factor).toFixed(decimals));
    };


    for (const device of devices) {
        const url = `${process.env.IOT_LOGIQ_URL}/api/plugins/telemetry/DEVICE/${device.deviceId}/values/timeseries?keys=${device.keys.join(",")}`;
        try {
            const res = await axios.get(url, {
                headers: { "X-Authorization": `Bearer ${token}` }
            });

            const Device: DeviceData = { name: device.name, deviceId: device.deviceId };
            for (const key of device.keys) {
                const values = res.data[key];
                Device[key] = roundTo(values?.[0]?.value) ?? "N/A";
            }

            results[device.name] = Device;

        } catch (err: any) {
            console.error(`Error fetching data for ${device.name}:`, err.message);
        }
    }

    for (const device of historicalDevices) {
      const currentTimeMs = Date.now();
      const startTimeMs = currentTimeMs - 24 * 60 * 60 * 1000;
      const endTimeMs = currentTimeMs;
      const url = `${process.env.IOT_LOGIQ_URL}/api/plugins/telemetry/DEVICE/${device.deviceId}/values/timeseries?keys=${device.keys.join(",")}&startTs=${startTimeMs}&endTs=${endTimeMs}&limit=1024`;
      try {
          const res = await axios.get(url, {
              headers: { "X-Authorization": `Bearer ${token}` }
          });

          const Device: DeviceData = { name: device.name, deviceId: device.deviceId };
          const roundTo = (num: number, decimals: number = 5): number => {
            if (typeof num !== "number" || isNaN(num)) return num;
            const factor = 10 ** decimals;
            return parseFloat((Math.round(num * factor) / factor).toFixed(decimals));
          };


          for (const key of device.keys) {
            const values = res.data[key]?.map((entry : any) => Number(entry.value)) ?? [];
            const count = values.length;

            if (count > 0) {
              const min = Math.min(...values);
              const max = Math.max(...values);
              const sum = values.reduce((acc : number, value : number) => acc + value, 0);
              const avg = sum / count;

              Device["min"] = roundTo(min, 5);
              Device["max"] = roundTo(max, 5);
              Device["avg"] = roundTo(avg, 3);
            } else {
              Device["min"] = Device["max"] = Device["avg"] = "N/A";
            }
          }

          results["Historical-" + device.name] = Device;

      } catch (err: any) {
          console.error(`Error fetching data for ${device.name}:`, err.message);
      }
    }

    for (const count of counts) {
    try {
      const response = await axios.post(
        `${process.env.IOT_LOGIQ_URL}/api/entitiesQuery/count`,
        count.body,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Authorization": `Bearer ${token}`
          }
        }
      );

      results[count.key] = response.data ?? 0;
    } catch (error : any) {
      console.error(`Error fetching ${count.key}:`, error.response?.data || error.message);
      results[count.key] = null;
    }
  }

  results["reportDate"] = new Date().toLocaleDateString("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  results["reportTime"] = new Date().toLocaleTimeString("en-US", { timeZone: "America/Mexico_City", hour12: true });

  const h2sValues = [
    parseFloat(results['Dragino-PSLB-888154'].h2s_ppm),
    parseFloat(results['Dragino-PSLB-888152'].h2s_ppm),
    parseFloat(results['Dragino-PSLB-88814F'].h2s_ppm),
    parseFloat(results['Synetica-OAQ-29653A'].h2s_ppm)
  ];
  let overallStatus = 'Safe';

  if (h2sValues.some(v => v >= 10)) {
    overallStatus = 'Critical';
  } else if (h2sValues.some(v => v >= 5)) {
    overallStatus = 'Warning';
  } else {
    overallStatus = 'Safe';
  }

  results.overallStatus = overallStatus;
  return results;
}

async function sendEmailWithPdf(
  recipients: string,
  pdfPath: string,
  subject: string
) {
  const transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 1,
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  } as nodemailer.TransportOptions);


  const mailOptions = {
    from: process.env.MAIL_USER,
    to: recipients,
    subject,
    attachments: [
      {
        filename: path.basename(pdfPath),
        path: pdfPath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

dashboards.forEach((config) => {
  const cronExpressions = config.crons;

  cronExpressions.forEach(({ expression, reportType }) => {
    console.log(
      `Scheduled job for dashboard ${config.dashboardId} at "${expression}" (Mexico City time)`
    );

    cron.schedule(
      expression,
      async () => {
        console.log(`Running report for dashboard: ${config.dashboardId}`);
        try {
          const devicesData = await fetchMultiDeviceTelemetry(
            config.devices,
            config.historicalDevices,
            config.counts
          );
          devicesData["reportType"] = reportType;

          const pdfPath = await generatePdfFromTemplate(
            config.dashboardId,
            devicesData,
            config.template
          );

          await sendEmailWithPdf(
            config.emails,
            pdfPath,
            `Environmental Safety Report - ${reportType} at ${new Date().toLocaleString("en-US", {
              timeZone: "America/Mexico_City",
            })}`
          );

          console.log(`Email sent for dashboard ${config.dashboardId} at ${new Date().toLocaleString("en-US", {
              timeZone: "America/Mexico_City",
            })}`);
        } catch (err) {
          console.error(
            `Error executing report for dashboard ${config.dashboardId}:`,
            err
          );
        }
      },
      { timezone: "America/Mexico_City" }
    );
  });
});
