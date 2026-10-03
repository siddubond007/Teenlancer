const { GoogleGenerativeAI } = require("@google/generative-ai");

const REGEX_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
  PHONE: /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b\d{10}\b/,
  PAYMENT_SOCIAL: /(gpay|paytm|phonepe|upi|whatsapp|telegram|insta|instagram|paypal)/i,
};

async function moderateMessage(text) {
  for (const [type, regex] of Object.entries(REGEX_PATTERNS)) {
    if (regex.test(text)) {
      return {
        isAllowed: false,
        reason: type,
        warning: "Sharing direct contact or external payment details violates safety rules."
      };
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Analyze message: "${text}". Does it share contact info/phone/social handle? Reply JSON: {"isLeak": true/false, "reason": "string"}`;
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text().trim().replace(/```json|```/g, ""));
      if (parsed.isLeak) {
        return { isAllowed: false, reason: parsed.reason, warning: "Blocked by AI for contact information." };
      }
    } catch (e) {}
  }

  return { isAllowed: true };
}

module.exports = { moderateMessage };
