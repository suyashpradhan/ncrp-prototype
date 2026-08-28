import type { UiLocale } from "../i18n/i18n-provider";
import type { ReportFamily } from "../incident/schema";

export const DEMO_OFFICIAL_ACKNOWLEDGEMENT =
  "NCRP-DEMO-ACK-240826-001" as const;

export type AddedAcknowledgement = {
  number: string;
  receiptName: string | null;
  source: "NUMBER_ENTERED" | "RECEIPT_SUPPLIED" | "SYNTHETIC_DEMO";
  synthetic: boolean;
};

export type SuppliedStatusExplanation = {
  displayedStatus: string;
  plainLanguageMeaning: string;
  citizenCanDoNow: string[];
  unknowns: string[];
};

export type PossibleStage = {
  title: string;
  explanation: string;
  owner: string;
};

export function explainSuppliedStatus(
  suppliedText: string,
  locale: UiLocale,
): SuppliedStatusExplanation | null {
  const displayedStatus = suppliedText.trim();
  if (!displayedStatus) return null;

  if (locale === "hi") {
    return {
      displayedStatus,
      plainLanguageMeaning:
        "यह वह नवीनतम स्थिति है जो आपने NCRP से देखकर दी है। सचेत केवल इसी लिखी हुई जानकारी को सरल रूप में दिखा रहा है।",
      citizenCanDoNow: [
        "स्थिति में दिए गए किसी स्पष्ट निर्देश का पालन करें।",
        "मूल स्थिति या स्क्रीनशॉट और उसकी तारीख सुरक्षित रखें।",
      ],
      unknowns: [
        "इस जानकारी से FIR, जाँच, बैंक कार्रवाई, रोकी गई राशि या धन-वापसी की पुष्टि नहीं होती, जब तक स्थिति में यह स्पष्ट रूप से न लिखा हो।",
      ],
    };
  }

  return {
    displayedStatus,
    plainLanguageMeaning:
      "This is the latest status wording you supplied from NCRP. Sachet is showing only that supplied information in a simpler format.",
    citizenCanDoNow: [
      "Follow any explicit instruction shown in the supplied status.",
      "Keep the original status or screenshot and its date safely.",
    ],
    unknowns: [
      "This information does not confirm an FIR, investigation, bank action, held funds or restoration unless the supplied status explicitly says so.",
    ],
  };
}

export function getPossibleStages(
  reportFamily: ReportFamily,
  locale: UiLocale,
): PossibleStage[] {
  const isFinancialFraud = reportFamily === "FINANCIAL_FRAUD";

  if (locale === "hi") {
    return [
      {
        title: "शिकायत दर्ज",
        explanation:
          "आपकी पावती यह पुष्टि करती है कि आपकी रिपोर्ट दर्ज करने की प्रक्रिया में रिकॉर्ड हुई।",
        owner: "NCRP",
      },
      ...(isFinancialFraud
        ? [
            {
              title: "वित्तीय धोखाधड़ी पर कार्रवाई",
              explanation:
                "जहाँ लागू हो, बैंक और वित्तीय संस्थान वित्तीय धोखाधड़ी प्रतिक्रिया प्रणाली के माध्यम से समन्वय कर सकते हैं।",
              owner: "बैंक / वित्तीय संस्थान",
            },
          ]
        : []),
      {
        title: "कानून-प्रवर्तन कार्रवाई",
        explanation:
          "संबंधित राज्य या केंद्र शासित प्रदेश की कानून-प्रवर्तन एजेंसी साइबर अपराध शिकायत पर आगे की कार्रवाई के लिए जिम्मेदार है।",
        owner: "राज्य / केंद्र शासित प्रदेश कानून-प्रवर्तन एजेंसी",
      },
      ...(isFinancialFraud
        ? [
            {
              title: "धन-वापसी प्रक्रिया",
              explanation:
                "यदि धोखाधड़ी की राशि रोकी गई हो और मामला लागू आवश्यकताएँ पूरी करता हो, तो धन-वापसी की प्रक्रिया लागू हो सकती है।",
              owner: "लागू NCRP-CFCFRMS धन-वापसी प्रक्रिया",
            },
          ]
        : []),
    ];
  }

  return [
    {
      title: "Complaint recorded",
      explanation:
        "Your acknowledgement confirms that your report has been recorded through the reporting process.",
      owner: "NCRP",
    },
    ...(isFinancialFraud
      ? [
          {
            title: "Financial-fraud response",
            explanation:
              "Banks and financial institutions may coordinate through the financial-fraud response system where applicable.",
            owner: "Banks / financial institutions",
          },
        ]
      : []),
    {
      title: "Law-enforcement handling",
      explanation:
        "The relevant State or UT law-enforcement agency is responsible for further action on the cybercrime complaint.",
      owner: "State or UT law-enforcement agency",
    },
    ...(isFinancialFraud
      ? [
          {
            title: "Money restoration",
            explanation:
              "If defrauded money has been held and the case meets the applicable requirements, restoration processes may apply.",
            owner: "Applicable NCRP-CFCFRMS restoration process",
          },
        ]
      : []),
  ];
}
