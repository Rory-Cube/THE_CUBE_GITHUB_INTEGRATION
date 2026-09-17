// view(`CuratedAccountsSnapshot`, {
//   shown: true,
//   description: `Account level AR detail for each day, optimized for historical trends and aging analysis`,
//   meta: {
//     ai_context: `HISTORICAL AR AND AGINGS VIEW - USE THIS FOR HISTORICAL ANALYSIS

// PRIMARY PURPOSE:
// - This view contains account-level AR (Accounts Receivable) detail for each day
// - Use this view when users ask about historical AR, historical agings, or AR trends over time
// - This is the correct view for analyzing how AR and agings have changed over time with account-level details and partitions

// EVIDENCE AND INFERENCE RULES:
// - Only make statements that are directly supported by fields, records, filters, calculations, or query results from this view or other explicitly selected data sources
// - Do NOT make inference-based statements, assumptions, or causal explanations unless the supporting evidence is present in the data
// - Do NOT infer intent, root cause, account status, follow-up priority, collectability, or expected outcome unless those values are explicitly represented in the data
// - When the data does not support a conclusion, say so clearly, for example: “The available data does not indicate why this balance remains open”
// - Avoid speculative language such as “likely,” “probably,” “may be due to,” “appears to be caused by,” or “suggests that” unless the statement is explicitly supported by a field or documented evidence
// - If a user asks for a conclusion that requires inference beyond the data, explain what evidence is available and what additional data would be needed to support that conclusion
      
// KEY DISTINCTION - HISTORICAL vs CURRENT:
// - This view is for HISTORICAL AR analysis (trends over time)
// - Do NOT use this view for current/most recent AR or zero balance closed account/AR review - use CuratedAccountsOpen for current AR and CuratedAccountsZero for historical closed AR research and trends instead
// - Current AR = most recent record only
// - Historical AR = trends and changes over time (this view)

// DATA UPDATE FREQUENCY AND BEST PRACTICES:
// - Account details are updated WEEKLY, not daily
// - Even though the view contains daily records, the underlying data refreshes weekly
// - When querying for trends, ALWAYS limit results to one day per week OR one day per month unless the user clearly specifies another result.
// - Do NOT return every day of the week - this creates redundant data and poor performance
// - Example: Use WHERE EXTRACT(DOW FROM ReportDate) = 6 for weekly (Saturdays only)
// - Example: Use WHERE ReportDate = DATE_TRUNC('month', ReportDate) + INTERVAL '1 month' - INTERVAL '1 day' for monthly (last day of month)
// - Default time range: Limit results to 13 weeks maximum for weekly trends or 6 months maximum for monthly trends unless the user explicitly requests a longer time period

// IMPORTANT USER REMINDERS:
// - Data accuracy is at the weekly refresh level, not daily
// - Historical snapshots represent the state of AR as of the weekly update

// COMMON QUERY PATTERNS:
// - Historical AR balance trends by facility, payor, or date range
// - Aging bucket analysis over time (DFDTier, DFSTier)
// - Account-level detail for specific time periods
// - Comparing AR across different time periods (week-over-week, month-over-month)
// - Tracking how individual accounts have aged over time`
//   },
//   cubes: [
//       {
//         join_path: PatientAccountSnapshot,
//         includes: [          
// 			      {
// 				      name: `ClientAccountNumber`,
// 				      alias: `ClientAccountNumber`,
// 			      },
//             {
// 				      name: `ClientAccountName`,
// 				      alias: `ClientAccountName`,
// 			      },
//             {
//               name: `PatientAccountNumber`,
//               alias: `PatientAccountNumber`,
//             },
//             {		  
//               name: `HospitalPhysician`,
//               alias: `HospitalPhysician`, 
//             },		            
//             {
//               name: `DischargeDatetime`,
//               alias: `DischargeDatetime`,
//             },
//             {
//               name: `AdmitDatetime`,
//               alias: `AdmitDatetime`,
//             },  
//             {
//               name:`ClientAccountBillingStatusDescription`,
//               alias:`ClientAccountBillingStatusDescription`,
//             },
//             {
//               name: `ClientAccountBillingStatusCode`,
//               alias: `ClientAccountBillingStatusCode`,
//             },
//             {
// 		        name: `Balance`,
// 		        alias: `Balance`,
// 	        },
//             {
//               name: `AccountTotalCharges`,
//               alias: `AccountTotalCharges`,
//             },
//             {
//               name: `FirstBillDate`,
//               alias: `FirstBillDate`,
//             }, 
//             {
//               name: `BillingStatus`,
//               alias: `BillingStatus`,
//             }, 
//             {
//               name: `DaysFromDischarge`,
//               alias: `DaysFromDischarge`,
//             },
//             {
//               name: `DaysFromInitialSubmit`,
//               alias: `DaysFromInitialSubmit`,
//             },
//             {
//               name: `DaysFromMostRecentSubmit`,
//               alias: `DaysFromMostRecentSubmit`,
//             },
//             {
//               name: `DFDTier`,
//               alias: `DFDTier`,
//             },
//             {
//               name: `InitialDFSTier`,
//               alias: `InitialDFSTier`,
//             },
//             {
//               name: `MostRecentDFSTier`,
//               alias: `MostRecentDFSTier`,
//             },
//             {       
//               name: `ClientPatientTypeCode`,
//               alias: `ClientPatientTypeCode`
//             },
//             {       
//               name: `ClientPatientTypeDescription`,
//               alias: `ClientPatientTypeDescription`,
//             },
//             {       
//               name: `ClientServiceTypeCode`,
//               alias: `ClientServiceTypeCode`,
//             },
// 	        {		  
//               name: `ClientServiceTypeDescription`,
//               alias: `ClientServiceTypeDescription`, 
//             },
//             {       
//               name: `MinorPatientType`,
//               alias: `MinorPatientType`, 
//             },
//             {       
//               name: `MinorPatientTypeDescription`,
//               alias: `MinorPatientTypeDescription`
//             },
//             {         
//               name: `MajorPatientType`,
//               alias: `MajorPatientType`,
//             },
//             {       
//               name: `MajorPatientTypeDescription`,
//               alias: `MajorPatientTypeDescription`
//             },
//             {
//               name: `count`,
//               alias: `count`,
//             },
//             {
//               name: `BalanceSum`,
//               alias: `BalanceSum`,
//             },
//             {
//               name: `DebitARBalanceSum`,
//               alias: `DebitARBalanceSum`,
//             },
//             {
//               name: `DebitARAccountCount`,
//               alias: `DebitARAccountCount`,
//             },
//             {
//               name: `dateDay`,
//               alias: `ReportDate`,
//             },
//             {
//               name: `BalanceTier`,
//               alias: `BalanceTier`,
//             },
//             {
//               name: `BalanceTierSort`,
//               alias: `BalanceTierSort`,
//             },
//             {
//               name: `DischargeDepartmentCode`,
//               alias: `DischargeDepartmentCode`,
//             },
//             {
//               name: `DischargeDepartmentName`,
//               alias: `DischargeDepartmentName`,
//             }, 
//             {
//               name: `DFDTierSort`,
//               alias: `DFDTierSort`,
//             },  
//             {
//               name: `DFSTierSort`,
//               alias: `DFSTierSort`,
//             },
//             {
//               name: `OutsourcingVendor`,
//               alias: `OutsourcingVendor`,
//             },                       
// 	      ],
//         prefix: false,
//       },
//       {
//         join_path: PatientAccountSnapshot.Facility,
//         includes: [
//             {
//               name: `FacilityName`,
//               alias: `FacilityName`,
//             },
//             {
//               name: `FacilityId`,
//               alias: `FacilityId`,
//             }
//         ],
//         prefix: false,
//       },
//       {
//         join_path: PatientAccountSnapshot.LiabilityParty_Current.SponsorPlan,
//         includes: [
//             {
//               name: `SponsorPlanCode`,
//               alias: `SponsorPlanCode`,
//             },
//             {
//               name: `SponsorPlanDescription`,
//               alias: `SponsorPlanDescription`,
//             },
//             {
//               name: `PayorGroupCode`,
//               alias: `PayorGroupCode`,
//             },
//             {
//               name: `PayorGroupDescription`,
//               alias: `PayorGroupDescription`,
//             },
//             {
//               name: `FinancialClassGroupCode`,
//               alias: `FinancialClassGroupCode`,
//             },
//             {
//               name: `FinancialClassGroupDescription`,
//               alias: `FinancialClassGroupDescription`,
//             }
//         ],
//         prefix: true,
//         alias: `CurrentSponsorPlan`,
//       },
//       {
//         join_path: PatientAccountSnapshot.LiabilityParty_Primary.SponsorPlan,
//         includes: [
//             {
//               name: `SponsorPlanCode`,
//               alias: `SponsorPlanCode`,
//             },
//             {
//               name: `SponsorPlanDescription`,
//               alias: `SponsorPlanDescription`,
//             },
//             {
//               name: `PayorGroupCode`,
//               alias: `PayorGroupCode`,
//             },
//             {
//               name: `PayorGroupDescription`,
//               alias: `PayorGroupDescription`,
//             },
//             {
//               name: `FinancialClassGroupCode`,
//               alias: `FinancialClassGroupCode`,
//             },
//             {
//               name: `FinancialClassGroupDescription`,
//               alias: `FinancialClassGroupDescription`,
//             }
//         ],
//         prefix: true,
//         alias: `PrimarySponsorPlan`,
//       }
//     ]
//   });


view(`CuratedAccountsSnapshot`, {
  shown: true,
  description: `Account level AR detail for each day, optimized for historical trends and aging analysis`,
  meta: {
    ai_context: `HISTORICAL AR AND AGINGS VIEW - USE THIS FOR HISTORICAL ANALYSIS

PRIMARY PURPOSE:
- This view contains account-level AR (Accounts Receivable) detail for each day
- Use this view when users ask about historical AR, historical agings, or AR trends over time
- This is the correct view for analyzing how AR and agings have changed over time with account-level details and partitions

EVIDENCE AND INFERENCE RULES:
- Only make statements that are directly supported by fields, records, filters, calculations, or query results from this view or other explicitly selected data sources
- Do NOT make inference-based statements, assumptions, or causal explanations unless the supporting evidence is present in the data
- Do NOT infer intent, root cause, account status, follow-up priority, collectability, or expected outcome unless those values are explicitly represented in the data
- When the data does not support a conclusion, say so clearly, for example: "The available data does not indicate why this balance remains open"
- Avoid speculative language such as "likely," "probably," "may be due to," "appears to be caused by," or "suggests that" unless the statement is explicitly supported by a field or documented evidence
- If a user asks for a conclusion that requires inference beyond the data, explain what evidence is available and what additional data would be needed to support that conclusion

KEY DISTINCTION - HISTORICAL vs CURRENT:
- This view is for HISTORICAL AR analysis (trends over time)
- Do NOT use this view for current/most recent AR or zero balance closed account/AR review - use CuratedAccountsOpen for current AR and CuratedAccountsZero for historical closed AR research and trends instead
- Current AR = most recent record only
- Historical AR = trends and changes over time (this view)

DATA UPDATE FREQUENCY AND BEST PRACTICES:
- Account details are updated WEEKLY, not daily
- Even though the view contains daily records, the underlying data refreshes weekly
- When querying for trends, ALWAYS limit results to one day per week OR one day per month unless the user clearly specifies another result.
- Do NOT return every day of the week - this creates redundant data and poor performance
- Example: Use WHERE EXTRACT(DOW FROM ReportDate) = 6 for weekly (Saturdays only)
- Example: Use WHERE ReportDate = DATE_TRUNC('month', ReportDate) + INTERVAL '1 month' - INTERVAL '1 day' for monthly (last day of month)
- Default time range: Limit results to 13 weeks maximum for weekly trends or 6 months maximum for monthly trends unless the user explicitly requests a longer time period

IMPORTANT USER REMINDERS:
- Data accuracy is at the weekly refresh level, not daily
- Historical snapshots represent the state of AR as of the weekly update

COMMON QUERY PATTERNS:
- Historical AR balance trends by facility, payor, or date range
- Aging bucket analysis over time (DFDTier, DFSTier)
- Account-level detail for specific time periods
- Comparing AR across different time periods (week-over-week, month-over-month)
- Tracking how individual accounts have aged over time`
  },
  cubes: [
      {
        join_path: PatientAccountSnapshot,
        includes: [
            {
              name: `ClientAccountNumber`,
              alias: `ClientAccountNumber`,
            },
            {
              name: `ClientAccountName`,
              alias: `ClientAccountName`,
            },
            {
              name: `PatientAccountNumber`,
              alias: `PatientAccountNumber`,
            },
            {
              name: `HospitalPhysician`,
              alias: `HospitalPhysician`,
            },
            {
              name: `DischargeDatetime`,
              alias: `DischargeDatetime`,
            },
            {
              name: `AdmitDatetime`,
              alias: `AdmitDatetime`,
            },
            {
              name: `ClientAccountBillingStatusDescription`,
              alias: `ClientAccountBillingStatusDescription`,
            },
            {
              name: `ClientAccountBillingStatusCode`,
              alias: `ClientAccountBillingStatusCode`,
            },
            {
              name: `Balance`,
              alias: `Balance`,
            },
            {
              name: `AccountTotalCharges`,
              alias: `AccountTotalCharges`,
            },
            {
              name: `FirstBillDate`,
              alias: `FirstBillDate`,
            },
            {
              name: `BillingStatus`,
              alias: `BillingStatus`,
            },
            {
              name: `DaysFromDischarge`,
              alias: `DaysFromDischarge`,
            },
            {
              name: `DaysFromInitialSubmit`,
              alias: `DaysFromInitialSubmit`,
            },
            {
              name: `DaysFromMostRecentSubmit`,
              alias: `DaysFromMostRecentSubmit`,
            },
            {
              name: `DFDTier`,
              alias: `DFDTier`,
            },
            {
              name: `InitialDFSTier`,
              alias: `InitialDFSTier`,
            },
            {
              name: `MostRecentDFSTier`,
              alias: `MostRecentDFSTier`,
            },
            {
              name: `ClientPatientTypeCode`,
              alias: `ClientPatientTypeCode`
            },
            {
              name: `ClientPatientTypeDescription`,
              alias: `ClientPatientTypeDescription`,
            },
            {
              name: `ClientServiceTypeCode`,
              alias: `ClientServiceTypeCode`,
            },
            {
              name: `ClientServiceTypeDescription`,
              alias: `ClientServiceTypeDescription`,
            },
            {
              name: `MinorPatientType`,
              alias: `MinorPatientType`,
            },
            {
              name: `MinorPatientTypeDescription`,
              alias: `MinorPatientTypeDescription`
            },
            {
              name: `MajorPatientType`,
              alias: `MajorPatientType`,
            },
            {
              name: `MajorPatientTypeDescription`,
              alias: `MajorPatientTypeDescription`
            },
            {
              name: `count`,
              alias: `count`,
            },
            {
              name: `BalanceSum`,
              alias: `BalanceSum`,
            },
            {
              name: `DebitARBalanceSum`,
              alias: `DebitARBalanceSum`,
            },
            {
              name: `DebitARAccountCount`,
              alias: `DebitARAccountCount`,
            },
            {
              name: `dateDay`,
              alias: `ReportDate`,
            },
            {
              name: `BalanceTier`,
              alias: `BalanceTier`,
            },
            {
              name: `BalanceTierSort`,
              alias: `BalanceTierSort`,
            },
            {
              name: `DischargeDepartmentCode`,
              alias: `DischargeDepartmentCode`,
            },
            {
              name: `DischargeDepartmentName`,
              alias: `DischargeDepartmentName`,
            },
            {
              name: `DFDTierSort`,
              alias: `DFDTierSort`,
            },
            {
              name: `DFSTierSort`,
              alias: `DFSTierSort`,
            },
            {
              name: `OutsourcingVendor`,
              alias: `OutsourcingVendor`,
            },
        ],
        prefix: false,
      },
      {
        join_path: PatientAccountSnapshot.Facility,
        includes: [
            {
              name: `FacilityName`,
              alias: `FacilityName`,
            },
            {
              name: `FacilityId`,
              alias: `FacilityId`,
            }
        ],
        prefix: false,
      },
      {
        // CHANGED: path now terminates at the role cube SponsorPlan_Current
        // (was: PatientAccountSnapshot.LiabilityParty_Current.SponsorPlan)
        join_path: PatientAccountSnapshot.LiabilityParty_Current.SponsorPlan_Current,
        includes: [
            {
              name: `SponsorPlanCode`,
              alias: `SponsorPlanCode`,
            },
            {
              name: `SponsorPlanDescription`,
              alias: `SponsorPlanDescription`,
            },
            {
              name: `PayorGroupCode`,
              alias: `PayorGroupCode`,
            },
            {
              name: `PayorGroupDescription`,
              alias: `PayorGroupDescription`,
            },
            {
              name: `FinancialClassGroupCode`,
              alias: `FinancialClassGroupCode`,
            },
            {
              name: `FinancialClassGroupDescription`,
              alias: `FinancialClassGroupDescription`,
            }
        ],
        prefix: true,
        alias: `CurrentSponsorPlan`,   // UNCHANGED: member names stay the same
      },
      {
        // CHANGED: path now terminates at the role cube SponsorPlan_Primary
        // (was: PatientAccountSnapshot.LiabilityParty_Primary.SponsorPlan)
        join_path: PatientAccountSnapshot.LiabilityParty_Primary.SponsorPlan_Primary,
        includes: [
            {
              name: `SponsorPlanCode`,
              alias: `SponsorPlanCode`,
            },
            {
              name: `SponsorPlanDescription`,
              alias: `SponsorPlanDescription`,
            },
            {
              name: `PayorGroupCode`,
              alias: `PayorGroupCode`,
            },
            {
              name: `PayorGroupDescription`,
              alias: `PayorGroupDescription`,
            },
            {
              name: `FinancialClassGroupCode`,
              alias: `FinancialClassGroupCode`,
            },
            {
              name: `FinancialClassGroupDescription`,
              alias: `FinancialClassGroupDescription`,
            }
        ],
        prefix: true,
        alias: `PrimarySponsorPlan`,   // UNCHANGED: member names stay the same
      }
    ]
  });