// Form submit hone ke baad Email + WhatsApp notifications
import nodemailer from "nodemailer";
import "dotenv/config";

const env = process.env;
const BRAND = env.BRAND_NAME || "Signature Catering & Event Management";
const BRAND_PHONE = env.BRAND_PHONE || "0321 8255469";

const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const TYPE_LABELS = {
  barat: "Barat", walima: "Valima", mehndi: "Mehndi & Dholki", nikah: "Nikah",
  catering: "Catering", decor: "Stage & Decor", birthday: "Birthday", corporate: "Corporate Events",
};
// "19:00" → "7:00 PM"
const time12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
export const timingText = (start, end) =>
  start && end ? `${time12(start)} – ${time12(end)}` : start ? `From ${time12(start)}` : end ? `Until ${time12(end)}` : "";

const typeNames = (csv) => (csv ? csv.split(",").map((t) => TYPE_LABELS[t] || t).join(", ") : "-");

// 03xx xxxxxxx → 923xxxxxxxxx (WhatsApp ko international format chahiye)
export function toIntlPK(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "92" + d.slice(1);
  else if (d.length === 10 && d.startsWith("3")) d = "92" + d;
  return d.length >= 11 ? d : "";
}

/* ======================= EMAIL ======================= */

const mailer = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT) || 465,
      secure: (Number(env.SMTP_PORT) || 465) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

const FROM = env.MAIL_FROM || `"${BRAND}" <${env.SMTP_USER}>`;

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 0"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6dcc6">
      <tr><td style="background:#0b0b0c;padding:26px;text-align:center;border-bottom:3px solid #d4af5f">
        <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:6px;color:#d4af5f">SIGNATURE</div>
        <div style="font-size:10px;letter-spacing:3px;color:#e8e2d4;margin-top:6px">CATERING &amp; EVENT MANAGEMENT</div>
      </td></tr>
      <tr><td style="padding:28px 30px;color:#1a1a1c;font-size:15px;line-height:1.6">
        <h2 style="margin:0 0 16px;font-family:Georgia,serif;color:#0b0b0c">${title}</h2>
        ${bodyHtml}
      </td></tr>
      <tr><td style="background:#0b0b0c;color:#bdb6a6;font-size:12px;text-align:center;padding:16px">
        <span style="color:#d4af5f;font-style:italic">Every Occasion, Our Signature Touch</span><br>
        ☎ ${esc(BRAND_PHONE)} · ✉ ${esc(env.ADMIN_EMAIL || env.SMTP_USER || "")}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function rowsTable(rows) {
  return `<table cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
    ${rows.filter(([, v]) => v).map(([k, v], i) => `<tr style="background:${i % 2 ? "#ffffff" : "#faf6ec"}">
      <td style="width:38%;color:#8a6d2b;font-weight:bold;border-bottom:1px solid #eee">${esc(k)}</td>
      <td style="border-bottom:1px solid #eee">${esc(v)}</td></tr>`).join("")}
  </table>`;
}

async function sendMail(to, subject, html, replyTo) {
  if (!mailer || !to) return;
  await mailer.sendMail({ from: FROM, to, subject, html, replyTo });
}

/* ===================== WHATSAPP ===================== */
// Meta WhatsApp Cloud API. Templates Meta Business Manager mein approve honi chahiye.

async function sendWhatsAppTemplate(to, template, params) {
  if (!env.WA_TOKEN || !env.WA_PHONE_NUMBER_ID || !template || !to) return;
  const res = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: env.WA_TEMPLATE_LANG || "en" },
        components: [{ type: "body", parameters: params.map((p) => ({ type: "text", text: String(p || "-").slice(0, 900) })) }],
      },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`);
}

/* ===================== PUBLIC ===================== */

// har notification alag; ek fail ho to baaqi chalti rahein. Form ka response in ka intezar nahi karta.
async function runAll(label, tasks) {
  const results = await Promise.allSettled(tasks.map((t) => t()));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[notify] ${label} #${i + 1} failed:`, r.reason?.message || r.reason);
  });
}

export function notifyEnquiry(id, e) {
  const events = typeNames(e.event_types);
  const wa = toIntlPK(e.whatsapp || e.phone);
  const timing = timingText(e.start_time, e.end_time);
  const rows = [
    ["Enquiry #", String(id)], ["Name", e.name], ["WhatsApp / Mobile", e.phone],
    ["Email", e.email], ["City", e.city], ["Event(s)", events], ["Event date", e.event_date], ["Timing", timing],
    ["Guests", e.guests ? String(e.guests) : ""], ["Enquiry for", e.enquiry_for], ["Message", e.message],
  ];

  const adminHtml = layout("New enquiry received", `${rowsTable(rows)}
    <p style="margin-top:20px">
      <a href="tel:${esc(e.phone)}" style="background:#0b0b0c;color:#d4af5f;padding:10px 18px;border-radius:20px;text-decoration:none;font-weight:bold">Call</a>
      ${wa ? `&nbsp;<a href="https://wa.me/${wa}" style="background:#25d366;color:#fff;padding:10px 18px;border-radius:20px;text-decoration:none;font-weight:bold">WhatsApp</a>` : ""}
    </p>`);

  const customerHtml = layout(`Thank you, ${esc(e.name)}!`, `
    <p>Thank you for contacting <b>${esc(BRAND)}</b>. We have received your enquiry and our team will call you shortly.</p>
    ${rowsTable([["Reference #", String(id)], ["Event(s)", events], ["Event date", e.event_date], ["Timing", timing], ["City", e.city], ["Guests", e.guests ? String(e.guests) : ""]])}
    <p style="margin-top:18px">For anything urgent, call or WhatsApp us on <b>${esc(BRAND_PHONE)}</b>.</p>
    <p>Warm regards,<br><b>Team Signature</b></p>`);

  return runAll(`enquiry ${id}`, [
    () => sendMail(list(env.ADMIN_EMAIL), `New Enquiry #${id} — ${e.name} (${events}, ${e.city})`, adminHtml, e.email || undefined),
    () => sendMail(e.email, `Thank you for contacting ${BRAND}`, customerHtml),
    ...list(env.ADMIN_WHATSAPP).map((to) => () =>
      sendWhatsAppTemplate(to, env.WA_TEMPLATE_ADMIN, [`#${id}`, e.name, e.phone, events, [e.event_date, timing, e.city].filter(Boolean).join(", ")])),
    () => sendWhatsAppTemplate(wa, env.WA_TEMPLATE_CUSTOMER, [e.name, `#${id}`]),
  ]);
}

export function notifyVendor(id, v) {
  const rows = [
    ["Vendor #", String(id)], ["Business", v.business_name], ["Contact", v.contact_name], ["WhatsApp / Mobile", v.phone],
    ["City", v.city], ["Service", TYPE_LABELS[v.service_type] || v.service_type],
  ];
  return runAll(`vendor ${id}`, [
    () => sendMail(list(env.ADMIN_EMAIL), `New Vendor Registration #${id} — ${v.business_name}`, layout("New vendor registration", rowsTable(rows))),
    ...list(env.ADMIN_WHATSAPP).map((to) => () =>
      sendWhatsAppTemplate(to, env.WA_TEMPLATE_ADMIN, [`Vendor #${id}`, v.business_name, v.phone, TYPE_LABELS[v.service_type] || v.service_type, v.city])),
  ]);
}

export const notifyStatus = () => ({
  email: Boolean(mailer),
  whatsapp: Boolean(env.WA_TOKEN && env.WA_PHONE_NUMBER_ID),
});

export async function verifyMailer() {
  if (!mailer) return "not configured";
  await mailer.verify();
  return "ok";
}
