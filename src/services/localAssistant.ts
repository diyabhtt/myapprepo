import { formatCurrency } from '@/lib/formatters'
import { translateStatusLabel } from '@/lib/i18n'
import { type ClaimContext, type Member, type SupportedLanguage } from '@/types'

type LocalIntent = 'hello' | 'why' | 'who' | 'cost' | 'coverage' | 'access' | 'general'
export interface LocalAssistantReply {
  content: string
  language: SupportedLanguage
}

const KEYWORDS: Record<LocalIntent, Partial<Record<SupportedLanguage, string[]>>> = {
  hello: {
    Amharic: ['ሰላም', 'ሄሎ'],
    English: ['hello', 'hi', 'hey'],
    French: ['bonjour', 'salut'],
    Gujarati: ['નમસ્તે', 'હેલો'],
    Japanese: ['こんにちは', 'もしもし'],
    'Mandarin Chinese': ['你好'],
    'Chinese (Simplified)': ['你好'],
    'Chinese (Traditional)': ['你好'],
    Cantonese: ['你好'],
    Spanish: ['hola', 'buenas'],
    Nepali: ['नमस्ते', 'हेलो'],
    Hindi: ['नमस्ते', 'हेलो'],
    Korean: ['안녕', '여보세요'],
    Telugu: ['నమస్తే', 'హలో'],
    Vietnamese: ['xin chào', 'chào'],
  },
  why: {
    Amharic: ['ለምን', 'ምክንያት'],
    English: ['why', 'reason', 'denied', 'action needed'],
    French: ['pourquoi', 'raison'],
    Gujarati: ['શા માટે', 'કારણ'],
    Japanese: ['なぜ', 'どうして', '理由'],
    'Mandarin Chinese': ['为什么', '原因'],
    'Chinese (Simplified)': ['为什么', '原因'],
    'Chinese (Traditional)': ['為什麼', '原因'],
    Cantonese: ['點解', '原因'],
    Spanish: ['por qué', 'porque', 'razón', 'motivo'],
    Nepali: ['किन', 'कारण', 'कारबाही'],
    Hindi: ['क्यों', 'कारण', 'कार्रवाई'],
    Korean: ['왜', '이유', '조치'],
    Telugu: ['ఎందుకు', 'కారణం'],
    Vietnamese: ['tại sao', 'vì sao', 'lý do', 'xử lý'],
  },
  who: {
    Amharic: ['ማን', 'ቀጣይ እርምጃ'],
    English: ['who', 'next step', 'needs to act'],
    French: ['qui', 'prochaine étape'],
    Gujarati: ['કોણ', 'આગલું પગલું'],
    Japanese: ['誰', '次のステップ', '誰が'],
    'Mandarin Chinese': ['谁', '下一步'],
    'Chinese (Simplified)': ['谁', '下一步'],
    'Chinese (Traditional)': ['誰', '下一步'],
    Cantonese: ['邊個', '下一步'],
    Spanish: ['quién', 'siguiente paso', 'debe actuar'],
    Nepali: ['को', 'कसले', 'अर्को कदम'],
    Hindi: ['कौन', 'किसे', 'अगला कदम'],
    Korean: ['누가', '다음 단계'],
    Telugu: ['ఎవరు', 'తర్వాతి దశ', 'తదుపరి దశ'],
    Vietnamese: ['ai', 'bước tiếp theo'],
  },
  cost: {
    Amharic: ['ወጪ', 'ስንት'],
    English: ['owe', 'cost', 'pay', 'price'],
    French: ['coût', 'payer', 'combien'],
    Gujarati: ['ખર્ચ', 'કેટલું'],
    Japanese: ['いくら', '費用', '支払'],
    'Mandarin Chinese': ['费用', '多少钱'],
    'Chinese (Simplified)': ['费用', '多少钱'],
    'Chinese (Traditional)': ['費用', '多少錢'],
    Cantonese: ['費用', '幾多錢'],
    Spanish: ['cuánto', 'costo', 'pagar'],
    Nepali: ['तिर्नु', 'लागत', 'कति'],
    Hindi: ['भुगतान', 'लागत', 'कितना'],
    Korean: ['얼마', '비용', '지불'],
    Telugu: ['ఖర్చు', 'ఎంత'],
    Vietnamese: ['bao nhiêu', 'chi phí', 'trả'],
  },
  coverage: {
    Amharic: ['ሽፋን', 'ቅድመ ፈቃድ'],
    English: ['covered', 'coverage', 'prior auth', 'prior authorization'],
    French: ['couvert', 'couverture', 'autorisation préalable'],
    Gujarati: ['કવર', 'કવરેજ', 'પૂર્વ મંજૂરી'],
    Japanese: ['補償', '給付', '事前承認', 'カバー'],
    'Mandarin Chinese': ['承保', '保险', '事先授权'],
    'Chinese (Simplified)': ['承保', '保险', '事先授权'],
    'Chinese (Traditional)': ['承保', '保險', '事先授權'],
    Cantonese: ['承保', '保險', '預先授權'],
    Spanish: ['cobertura', 'cubierto', 'autorización previa'],
    Nepali: ['कभर', 'कभरेज', 'पूर्व-अनुमोदन'],
    Hindi: ['कवर', 'कवरेज', 'पूर्व-अनुमोदन'],
    Korean: ['보장', '커버', '사전 승인'],
    Telugu: ['కవర్', 'కవరేజ్', 'ముందస్తు అనుమతి'],
    Vietnamese: ['chi trả', 'quyền lợi', 'phê duyệt trước'],
  },
  access: {
    Amharic: ['መዳረሻ', 'ቤተሰብ', 'ፈቃድ'],
    English: ['access', 'family', 'authorized', 'spouse'],
    French: ['accès', 'famille', 'autorisé'],
    Gujarati: ['ઍક્સેસ', 'કુટુંબ', 'અધિકૃત'],
    Japanese: ['アクセス', '家族', '承認', '権限'],
    'Mandarin Chinese': ['访问', '家人', '授权'],
    'Chinese (Simplified)': ['访问', '家人', '授权'],
    'Chinese (Traditional)': ['訪問', '家人', '授權'],
    Cantonese: ['存取', '家人', '授權'],
    Spanish: ['acceso', 'familia', 'autorizado'],
    Nepali: ['पहुँच', 'परिवार', 'अधिकृत'],
    Hindi: ['पहुँच', 'परिवार', 'अधिकृत'],
    Korean: ['접근', '가족', '승인'],
    Telugu: ['యాక్సెస్', 'కుటుంబం', 'అనుమతి'],
    Vietnamese: ['truy cập', 'gia đình', 'được ủy quyền'],
  },
  general: {},
}

const TRANSLATIONS = {
  English: {
    helloClaim: 'Hello. I reviewed claim {{claimId}} for {{serviceName}}.',
    helloGeneral: 'Hello. I can help with claims, coverage, costs, referrals, prior authorization, and authorized access.',
    statusLine: 'The current status is {{status}}.',
    reasonLine: 'The main reason is: {{reason}}',
    nextStepLine: 'The next step is: {{nextStep}}',
    actorLine: 'The next party to act is: {{actor}}.',
    costLine: 'The current estimated member cost is {{amount}}.',
    coverageCovered: 'This service is covered under the plan rules on file.',
    coverageNotCovered: 'This service is not listed as covered under the plan rules on file.',
    coveragePriorAuthYes: 'Prior authorization is required.',
    coveragePriorAuthNo: 'Prior authorization is not required.',
    accessLine: 'There are {{count}} active authorized contacts on file: {{names}}.',
    noneListed: 'none listed',
    generalLine: 'I can explain claim status, coverage, costs, next steps, and authorized access for {{memberName}}.',
    reasonReferral: 'The required referral is not on file yet.',
    reasonPriorAuth: 'Prior authorization is required and does not appear as obtained yet.',
    reasonModifier: 'The provider likely needs to correct the coding or modifier and resubmit.',
    reasonCob: 'The plan still needs coordination-of-benefits details before it can finish this claim.',
    reasonDiagnosis: 'The diagnosis attached to the service does not match the plan coverage rule on file.',
    reasonBundled: 'This service may already be included in another payment and could need provider follow-up.',
    reasonFilingLimit: 'The provider submitted the claim after the filing deadline, so the plan treated it as final.',
    reasonDeductible: 'The charge was applied to the deductible instead of being paid by the plan now.',
    reasonCoinsurance: 'The claim processed, but a coinsurance amount remains the member responsibility.',
    reasonInReview: 'The claim is still moving through plan review.',
    reasonPaid: 'The claim has already finished processing.',
    reasonDeniedGeneric: 'The claim is denied and still needs follow-up.',
    nextReferral: 'Ask the primary care manager or provider to submit the required referral.',
    nextPriorAuth: 'The provider needs to submit and obtain prior authorization before review can complete.',
    nextModifier: '{{providerName}} should resubmit the claim with the correct modifier.',
    nextFixable: 'Review the claim details and contact the provider if more documents are needed.',
    nextWait: 'Wait for plan review unless the status changes.',
    nextDone: 'No additional action is required right now.',
    actorProviderPcm: 'Provider or primary care manager',
    actorMemberProvider: 'Member and provider',
    actorPlanTeam: 'Plan review team',
    actorNone: 'No immediate action',
  },
  French: {
    helloClaim: 'Bonjour. J’ai examiné la réclamation {{claimId}}.',
    helloGeneral: 'Bonjour. Je peux aider avec les réclamations, la couverture, les coûts, les orientations, l’autorisation préalable et l’accès autorisé.',
    statusLine: 'Le statut actuel est {{status}}.',
    reasonLine: 'La raison principale est : {{reason}}',
    nextStepLine: 'La prochaine étape est : {{nextStep}}',
    actorLine: 'La prochaine partie qui doit agir est : {{actor}}.',
    costLine: 'Le coût estimé actuel pour le membre est de {{amount}}.',
    coverageCovered: 'Ce service est couvert selon les règles du régime au dossier.',
    coverageNotCovered: 'Ce service n’est pas indiqué comme couvert selon les règles du régime au dossier.',
    coveragePriorAuthYes: 'Une autorisation préalable est requise.',
    coveragePriorAuthNo: 'Une autorisation préalable n’est pas requise.',
    accessLine: 'Il y a {{count}} contacts autorisés actifs au dossier : {{names}}.',
    noneListed: 'aucun inscrit',
    generalLine: 'Je peux expliquer le statut de la réclamation, la couverture, les coûts, les prochaines étapes et l’accès autorisé pour {{memberName}}.',
    reasonReferral: 'L’orientation requise n’est pas encore au dossier.',
    reasonPriorAuth: 'Une autorisation préalable est requise et ne semble pas encore avoir été obtenue.',
    reasonModifier: 'Le prestataire doit probablement corriger le codage ou le modificateur et soumettre de nouveau.',
    reasonCob: 'Le régime a encore besoin des renseignements de coordination des prestations avant de pouvoir terminer cette réclamation.',
    reasonDiagnosis: 'Les renseignements diagnostiques associés au service ne correspondent pas à la règle de couverture du régime au dossier.',
    reasonBundled: 'Ce service est peut-être déjà inclus dans un autre paiement et pourrait nécessiter un suivi du prestataire.',
    reasonFilingLimit: 'Le prestataire a soumis la réclamation après la date limite de dépôt, donc le régime l’a traitée comme définitive.',
    reasonDeductible: 'Le montant a été appliqué à la franchise au lieu d’être payé maintenant par le régime.',
    reasonCoinsurance: 'La réclamation a été traitée, mais un montant de coassurance demeure à la charge du membre.',
    reasonInReview: 'Cette réclamation est toujours en cours d’examen par le régime.',
    reasonPaid: 'Cette réclamation a déjà terminé son traitement.',
    reasonDeniedGeneric: 'Cette réclamation est refusée et nécessite encore un suivi.',
    nextReferral: 'Demandez au médecin de premier recours ou au prestataire de soumettre l’orientation requise.',
    nextPriorAuth: 'Le prestataire doit soumettre et obtenir l’autorisation préalable avant que l’examen puisse être terminé.',
    nextModifier: '{{providerName}} doit soumettre de nouveau la réclamation avec le bon modificateur.',
    nextFixable: 'Examinez les détails de la réclamation et communiquez avec le prestataire si d’autres documents sont nécessaires.',
    nextWait: 'Attendez l’examen du régime à moins que le statut ne change.',
    nextDone: 'Aucune autre action n’est requise pour le moment.',
    actorProviderPcm: 'Prestataire ou médecin de premier recours',
    actorMemberProvider: 'Membre et prestataire',
    actorPlanTeam: 'Équipe d’examen du régime',
    actorNone: 'Aucune action immédiate',
  },
  Japanese: {
    helloClaim: 'こんにちは。請求 {{claimId}} を確認しました。',
    helloGeneral: 'こんにちは。請求、給付範囲、費用、紹介状、事前承認、承認済みアクセスについてお手伝いできます。',
    statusLine: '現在の状況は{{status}}です。',
    reasonLine: '主な理由は次のとおりです: {{reason}}',
    nextStepLine: '次の対応は次のとおりです: {{nextStep}}',
    actorLine: '次に対応する必要があるのは{{actor}}です。',
    costLine: '現在の会員負担見込み額は{{amount}}です。',
    coverageCovered: 'このサービスは登録されているプラン規則では給付対象です。',
    coverageNotCovered: 'このサービスは登録されているプラン規則では給付対象として記載されていません。',
    coveragePriorAuthYes: '事前承認が必要です。',
    coveragePriorAuthNo: '事前承認は必要ありません。',
    accessLine: '記録上、有効な承認済み連絡先は{{count}}件あります: {{names}}。',
    noneListed: '登録なし',
    generalLine: '{{memberName}} の請求状況、給付範囲、費用、次の対応、承認済みアクセスを説明できます。',
    reasonReferral: '必要な紹介状がまだ記録にありません。',
    reasonPriorAuth: '事前承認が必要ですが、まだ取得された形跡がありません。',
    reasonModifier: '医療提供者がコーディングまたは修飾子を修正して再提出する必要がある可能性があります。',
    reasonCob: 'この請求を完了する前に、プランは給付調整に関する情報をまだ必要としています。',
    reasonDiagnosis: 'このサービスに関連する診断情報が、記録上のプラン給付規則と一致していません。',
    reasonBundled: 'このサービスは別の支払いにすでに含まれている可能性があり、医療提供者の追加対応が必要な場合があります。',
    reasonFilingLimit: '医療提供者が提出期限後に請求を提出したため、プランはこれを最終結果として扱いました。',
    reasonDeductible: 'この金額は、現時点でプランが支払う代わりに免責額へ充当されました。',
    reasonCoinsurance: '請求は処理されましたが、共同保険額が会員負担として残っています。',
    reasonInReview: 'この請求はまだプランの審査中です。',
    reasonPaid: 'この請求の処理はすでに完了しています。',
    reasonDeniedGeneric: 'この請求は否認されており、まだ追加対応が必要です。',
    nextReferral: '主治医または医療提供者に、必要な紹介状を提出するよう依頼してください。',
    nextPriorAuth: '審査が完了する前に、医療提供者が事前承認を申請して取得する必要があります。',
    nextModifier: '{{providerName}} は正しい修飾子で請求を再提出する必要があります。',
    nextFixable: '請求の詳細を確認し、追加書類が必要なら医療提供者に連絡してください。',
    nextWait: '状況が変わらない限り、プランの審査を待ってください。',
    nextDone: '現時点で追加の対応は不要です。',
    actorProviderPcm: '医療提供者または主治医',
    actorMemberProvider: '会員と医療提供者',
    actorPlanTeam: 'プラン審査チーム',
    actorNone: 'すぐに必要な対応はありません',
  },
  'Chinese (Simplified)': {
    helloClaim: '您好。我已查看理赔 {{claimId}}。',
    helloGeneral: '您好。我可以协助说明理赔、保障、费用、转诊、事先授权和已授权访问。',
    statusLine: '当前状态是{{status}}。',
    reasonLine: '主要原因是：{{reason}}',
    nextStepLine: '下一步是：{{nextStep}}',
    actorLine: '下一位需要处理的是：{{actor}}。',
    costLine: '当前估计会员自付费用为{{amount}}。',
    coverageCovered: '根据档案中的计划规则，这项服务属于保障范围。',
    coverageNotCovered: '根据档案中的计划规则，这项服务未列为保障范围。',
    coveragePriorAuthYes: '需要事先授权。',
    coveragePriorAuthNo: '不需要事先授权。',
    accessLine: '档案中有{{count}}位有效的授权联系人：{{names}}。',
    noneListed: '未列出',
    generalLine: '我可以说明 {{memberName}} 的理赔状态、保障、费用、下一步以及授权访问情况。',
    reasonReferral: '所需的转诊目前还不在档案中。',
    reasonPriorAuth: '需要事先授权，而且看起来尚未取得。',
    reasonModifier: '服务提供方可能需要更正编码或修饰符后重新提交。',
    reasonCob: '在完成这笔理赔之前，计划仍需要协调给付的信息。',
    reasonDiagnosis: '与该服务相关的诊断信息与档案中的计划保障规则不匹配。',
    reasonBundled: '这项服务可能已经包含在另一笔付款中，可能需要服务提供方继续跟进。',
    reasonFilingLimit: '服务提供方在申报期限后提交了理赔，因此计划将其视为最终结果。',
    reasonDeductible: '这笔费用目前记入免赔额，而不是由计划立即支付。',
    reasonCoinsurance: '理赔已经处理，但仍有共同保险金额由会员承担。',
    reasonInReview: '这笔理赔仍在计划审核中。',
    reasonPaid: '这笔理赔已经处理完成。',
    reasonDeniedGeneric: '这笔理赔已被拒赔，仍需要后续跟进。',
    nextReferral: '请让初级保健医生或服务提供方提交所需的转诊。',
    nextPriorAuth: '在审核完成前，服务提供方需要提交并取得事先授权。',
    nextModifier: '{{providerName}} 应使用正确的修饰符重新提交理赔。',
    nextFixable: '请查看理赔详情，如需更多文件，请联系服务提供方。',
    nextWait: '除非状态变化，否则请等待计划审核。',
    nextDone: '目前不需要其他操作。',
    actorProviderPcm: '服务提供方或初级保健医生',
    actorMemberProvider: '会员和服务提供方',
    actorPlanTeam: '计划审核团队',
    actorNone: '暂时无需操作',
  },
  'Mandarin Chinese': {
    helloClaim: '您好。我已查看理赔 {{claimId}}。',
    helloGeneral: '您好。我可以协助说明理赔、保障、费用、转诊、事先授权和已授权访问。',
    statusLine: '当前状态是{{status}}。',
    reasonLine: '主要原因是：{{reason}}',
    nextStepLine: '下一步是：{{nextStep}}',
    actorLine: '下一位需要处理的是：{{actor}}。',
    costLine: '当前估计会员自付费用为{{amount}}。',
    coverageCovered: '根据档案中的计划规则，这项服务属于保障范围。',
    coverageNotCovered: '根据档案中的计划规则，这项服务未列为保障范围。',
    coveragePriorAuthYes: '需要事先授权。',
    coveragePriorAuthNo: '不需要事先授权。',
    accessLine: '档案中有{{count}}位有效的授权联系人：{{names}}。',
    noneListed: '未列出',
    generalLine: '我可以说明 {{memberName}} 的理赔状态、保障、费用、下一步以及授权访问情况。',
    reasonReferral: '所需的转诊目前还不在档案中。',
    reasonPriorAuth: '需要事先授权，而且看起来尚未取得。',
    reasonModifier: '服务提供方可能需要更正编码或修饰符后重新提交。',
    reasonCob: '在完成这笔理赔之前，计划仍需要协调给付的信息。',
    reasonDiagnosis: '与该服务相关的诊断信息与档案中的计划保障规则不匹配。',
    reasonBundled: '这项服务可能已经包含在另一笔付款中，可能需要服务提供方继续跟进。',
    reasonFilingLimit: '服务提供方在申报期限后提交了理赔，因此计划将其视为最终结果。',
    reasonDeductible: '这笔费用目前记入免赔额，而不是由计划立即支付。',
    reasonCoinsurance: '理赔已经处理，但仍有共同保险金额由会员承担。',
    reasonInReview: '这笔理赔仍在计划审核中。',
    reasonPaid: '这笔理赔已经处理完成。',
    reasonDeniedGeneric: '这笔理赔已被拒赔，仍需要后续跟进。',
    nextReferral: '请让初级保健医生或服务提供方提交所需的转诊。',
    nextPriorAuth: '在审核完成前，服务提供方需要提交并取得事先授权。',
    nextModifier: '{{providerName}} 应使用正确的修饰符重新提交理赔。',
    nextFixable: '请查看理赔详情，如需更多文件，请联系服务提供方。',
    nextWait: '除非状态变化，否则请等待计划审核。',
    nextDone: '目前不需要其他操作。',
    actorProviderPcm: '服务提供方或初级保健医生',
    actorMemberProvider: '会员和服务提供方',
    actorPlanTeam: '计划审核团队',
    actorNone: '暂时无需操作',
  },
  'Chinese (Traditional)': {
    helloClaim: '您好。我已查看理賠 {{claimId}}。',
    helloGeneral: '您好。我可以協助說明理賠、保障、費用、轉診、事先授權和已授權存取。',
    statusLine: '目前狀態是{{status}}。',
    reasonLine: '主要原因是：{{reason}}',
    nextStepLine: '下一步是：{{nextStep}}',
    actorLine: '下一位需要處理的是：{{actor}}。',
    costLine: '目前估計會員自付費用為{{amount}}。',
    coverageCovered: '根據檔案中的計畫規則，這項服務屬於保障範圍。',
    coverageNotCovered: '根據檔案中的計畫規則，這項服務未列為保障範圍。',
    coveragePriorAuthYes: '需要事先授權。',
    coveragePriorAuthNo: '不需要事先授權。',
    accessLine: '檔案中有{{count}}位有效的授權聯絡人：{{names}}。',
    noneListed: '未列出',
    generalLine: '我可以說明 {{memberName}} 的理賠狀態、保障、費用、下一步以及授權存取情況。',
    reasonReferral: '所需的轉診目前還不在檔案中。',
    reasonPriorAuth: '需要事先授權，而且看起來尚未取得。',
    reasonModifier: '服務提供方可能需要更正編碼或修飾符後重新提交。',
    reasonCob: '在完成這筆理賠之前，計畫仍需要協調給付的資訊。',
    reasonDiagnosis: '與該服務相關的診斷資訊與檔案中的計畫保障規則不相符。',
    reasonBundled: '這項服務可能已經包含在另一筆付款中，可能需要服務提供方繼續跟進。',
    reasonFilingLimit: '服務提供方在申報期限後提交了理賠，因此計畫將其視為最終結果。',
    reasonDeductible: '這筆費用目前記入免賠額，而不是由計畫立即支付。',
    reasonCoinsurance: '理賠已經處理，但仍有共同保險金額由會員承擔。',
    reasonInReview: '這筆理賠仍在計畫審核中。',
    reasonPaid: '這筆理賠已經處理完成。',
    reasonDeniedGeneric: '這筆理賠已被拒賠，仍需要後續跟進。',
    nextReferral: '請讓初級保健醫師或服務提供方提交所需的轉診。',
    nextPriorAuth: '在審核完成前，服務提供方需要提交並取得事先授權。',
    nextModifier: '{{providerName}} 應使用正確的修飾符重新提交理賠。',
    nextFixable: '請查看理賠詳情，如需更多文件，請聯絡服務提供方。',
    nextWait: '除非狀態變化，否則請等待計畫審核。',
    nextDone: '目前不需要其他操作。',
    actorProviderPcm: '服務提供方或初級保健醫師',
    actorMemberProvider: '會員和服務提供方',
    actorPlanTeam: '計畫審核團隊',
    actorNone: '暫時無需操作',
  },
  Cantonese: {
    helloClaim: '你好。我睇過索償 {{claimId}}。',
    helloGeneral: '你好。我可以幫你了解索償、保障、費用、轉介、預先授權同授權存取。',
    statusLine: '而家狀態係{{status}}。',
    reasonLine: '主要原因係：{{reason}}',
    nextStepLine: '下一步係：{{nextStep}}',
    actorLine: '下一個需要處理嘅係：{{actor}}。',
    costLine: '而家估計會員要付嘅費用係{{amount}}。',
    coverageCovered: '根據檔案入面嘅計劃規則，呢項服務有保障。',
    coverageNotCovered: '根據檔案入面嘅計劃規則，呢項服務唔屬於保障範圍。',
    coveragePriorAuthYes: '需要預先授權。',
    coveragePriorAuthNo: '唔需要預先授權。',
    accessLine: '檔案入面有{{count}}個有效授權聯絡人：{{names}}。',
    noneListed: '冇列出',
    generalLine: '我可以解釋 {{memberName}} 嘅索償狀態、保障、費用、下一步同授權存取。',
    reasonReferral: '需要嘅轉介而家仲未喺檔案入面。',
    reasonPriorAuth: '需要預先授權，而且睇落仲未攞到。',
    reasonModifier: '服務提供者可能要更正編碼或者修飾符，之後重新提交。',
    reasonCob: '喺完成呢項索償之前，計劃仲需要協調給付資料。',
    reasonDiagnosis: '同呢項服務有關嘅診斷資料，同檔案入面嘅計劃保障規則唔吻合。',
    reasonBundled: '呢項服務可能已經包咗喺另一筆付款入面，可能需要服務提供者再跟進。',
    reasonFilingLimit: '服務提供者喺申報期限之後先提交索償，所以計劃將佢視為最終結果。',
    reasonDeductible: '呢筆費用而家計入自付額，而唔係即時由計劃支付。',
    reasonCoinsurance: '索償已經處理，但仲有共同保險金額要由會員承擔。',
    reasonInReview: '呢項索償仲喺計劃審核中。',
    reasonPaid: '呢項索償已經完成處理。',
    reasonDeniedGeneric: '呢項索償已被拒絕，仲需要後續跟進。',
    nextReferral: '請叫家庭醫生或者服務提供者提交所需嘅轉介。',
    nextPriorAuth: '喺審核完成之前，服務提供者需要提交同取得預先授權。',
    nextModifier: '{{providerName}} 應該用正確修飾符重新提交索償。',
    nextFixable: '請查看索償詳情，如果需要更多文件，就聯絡服務提供者。',
    nextWait: '除非狀態有變，否則請等候計劃審核。',
    nextDone: '而家唔需要其他動作。',
    actorProviderPcm: '服務提供者或家庭醫生',
    actorMemberProvider: '會員同服務提供者',
    actorPlanTeam: '計劃審核團隊',
    actorNone: '暫時唔需要處理',
  },
  Gujarati: {
    helloClaim: 'નમસ્તે. મેં ક્લેમ {{claimId}} જોઈ છે.',
    helloGeneral: 'નમસ્તે. હું ક્લેમ, કવરેજ, ખર્ચ, રેફરલ, પૂર્વ મંજૂરી અને અધિકૃત ઍક્સેસ બાબતે મદદ કરી શકું છું.',
    statusLine: 'હાલની સ્થિતિ {{status}} છે.',
    reasonLine: 'મુખ્ય કારણ આ છે: {{reason}}',
    nextStepLine: 'આગલું પગલું આ છે: {{nextStep}}',
    actorLine: 'આગળ કાર્યવાહી કરનાર પક્ષ છે: {{actor}}.',
    costLine: 'હાલનો અંદાજિત સભ્ય ખર્ચ {{amount}} છે.',
    coverageCovered: 'ફાઈલમાં રહેલા પ્લાન નિયમો મુજબ આ સેવા કવર છે.',
    coverageNotCovered: 'ફાઈલમાં રહેલા પ્લાન નિયમો મુજબ આ સેવા કવર તરીકે દર્શાવાઈ નથી.',
    coveragePriorAuthYes: 'પૂર્વ મંજૂરી જરૂરી છે.',
    coveragePriorAuthNo: 'પૂર્વ મંજૂરી જરૂરી નથી.',
    accessLine: 'ફાઈલમાં {{count}} સક્રિય અધિકૃત સંપર્કો છે: {{names}}.',
    noneListed: 'કોઈ નોંધાયેલ નથી',
    generalLine: 'હું {{memberName}} માટે ક્લેમ સ્થિતિ, કવરેજ, ખર્ચ, આગળના પગલાં અને અધિકૃત ઍક્સેસ સમજાવી શકું છું.',
    reasonReferral: 'જરૂરી રેફરલ હજી ફાઈલમાં નથી.',
    reasonPriorAuth: 'પૂર્વ મંજૂરી જરૂરી છે અને હજી પ્રાપ્ત થયેલી દેખાતી નથી.',
    reasonModifier: 'પ્રદાતાને કોડિંગ અથવા મોડિફાયર સુધારીને ક્લેમ ફરીથી મોકલવો પડી શકે છે.',
    reasonCob: 'આ ક્લેમ પૂરો કરવા પહેલાં પ્લાનને હજી લાભ સંકલનની વિગતો જોઈએ છે.',
    reasonDiagnosis: 'આ સેવા સાથે જોડાયેલી નિદાન માહિતી ફાઈલમાં રહેલા પ્લાન કવરેજ નિયમ સાથે મેળ ખાતી નથી.',
    reasonBundled: 'આ સેવા કદાચ બીજી ચૂકવણીમાં પહેલેથી સામેલ હોય અને પ્રદાતાના અનુસરણની જરૂર પડી શકે છે.',
    reasonFilingLimit: 'પ્રદાતાએ સમયમર્યાદા પછી ક્લેમ દાખલ કર્યો હતો, તેથી પ્લાને તેને અંતિમ ગણ્યો.',
    reasonDeductible: 'આ રકમ હાલ પ્લાન દ્વારા ચૂકવવાના બદલે ડિડક્ટિબલમાં ગણાઈ છે.',
    reasonCoinsurance: 'ક્લેમ પ્રોસેસ થઈ ગયો, પરંતુ કોઇન્શ્યોરન્સની રકમ હજી સભ્યની જવાબદારી છે.',
    reasonInReview: 'આ ક્લેમ હજી પ્લાન સમીક્ષામાં છે.',
    reasonPaid: 'આ ક્લેમની પ્રક્રિયા પહેલેથી પૂર્ણ થઈ ગઈ છે.',
    reasonDeniedGeneric: 'આ ક્લેમ નકારી કાઢવામાં આવ્યો છે અને હજી અનુસરણ જોઈએ છે.',
    nextReferral: 'પ્રાથમિક કાળજી મેનેજર અથવા પ્રદાતાને જરૂરી રેફરલ મોકલવા કહો.',
    nextPriorAuth: 'સમીક્ષા પૂર્ણ થાય તે પહેલાં પ્રદાતાએ પૂર્વ મંજૂરી સબમિટ કરીને મેળવવી પડશે.',
    nextModifier: '{{providerName}} એ સાચા મોડિફાયર સાથે ક્લેમ ફરીથી મોકલવો જોઈએ.',
    nextFixable: 'ક્લેમની વિગતો જુઓ અને વધુ દસ્તાવેજોની જરૂર હોય તો પ્રદાતાનો સંપર્ક કરો.',
    nextWait: 'સ્થિતિ બદલાય નહીં ત્યાં સુધી પ્લાન સમીક્ષાની રાહ જુઓ.',
    nextDone: 'હમણાં કોઈ વધારાની કાર્યવાહી જરૂરી નથી.',
    actorProviderPcm: 'પ્રદાતા અથવા પ્રાથમિક કાળજી મેનેજર',
    actorMemberProvider: 'સભ્ય અને પ્રદાતા',
    actorPlanTeam: 'પ્લાન સમીક્ષા ટીમ',
    actorNone: 'તાત્કાલિક કાર્યવાહી નથી',
  },
  Telugu: {
    helloClaim: 'నమస్తే. నేను క్లెయిమ్ {{claimId}} చూసాను.',
    helloGeneral: 'నమస్తే. నేను క్లెయిమ్‌లు, కవరేజ్, ఖర్చులు, రిఫరల్‌లు, ముందస్తు అనుమతి మరియు అధీకృత యాక్సెస్ గురించి సహాయం చేయగలను.',
    statusLine: 'ప్రస్తుత స్థితి {{status}}గా ఉంది.',
    reasonLine: 'ప్రధాన కారణం ఇది: {{reason}}',
    nextStepLine: 'తదుపరి దశ ఇది: {{nextStep}}',
    actorLine: 'తర్వాత చర్య తీసుకోవాల్సిన పక్షం: {{actor}}.',
    costLine: 'ప్రస్తుతం అంచనా వేసిన సభ్యుడి ఖర్చు {{amount}}.',
    coverageCovered: 'ఫైల్‌లో ఉన్న ప్లాన్ నియమాల ప్రకారం ఈ సేవ కవరైంది.',
    coverageNotCovered: 'ఫైల్‌లో ఉన్న ప్లాన్ నియమాల ప్రకారం ఈ సేవ కవర్ అయినట్లు లేదు.',
    coveragePriorAuthYes: 'ముందస్తు అనుమతి అవసరం.',
    coveragePriorAuthNo: 'ముందస్తు అనుమతి అవసరం లేదు.',
    accessLine: 'రికార్డులో {{count}} చురుకైన అధీకృత సంప్రదింపులు ఉన్నాయి: {{names}}.',
    noneListed: 'ఏదీ జాబితాలో లేదు',
    generalLine: '{{memberName}} కోసం క్లెయిమ్ స్థితి, కవరేజ్, ఖర్చులు, తదుపరి దశలు మరియు అధీకృత యాక్సెస్‌ను నేను వివరించగలను.',
    reasonReferral: 'అవసరమైన రిఫరల్ ఇంకా రికార్డులో లేదు.',
    reasonPriorAuth: 'ముందస్తు అనుమతి అవసరం మరియు అది ఇంకా పొందినట్లు కనిపించడం లేదు.',
    reasonModifier: 'ప్రొవైడర్ కోడింగ్ లేదా మోడిఫైయర్ సరిచేసి క్లెయిమ్‌ను మళ్లీ సమర్పించాల్సి రావచ్చు.',
    reasonCob: 'ఈ క్లెయిమ్ పూర్తి చేయడానికి ముందు ప్లాన్‌కు ఇంకా ప్రయోజనాల సమన్వయ సమాచారము అవసరం.',
    reasonDiagnosis: 'ఈ సేవకు సంబంధించిన నిర్ధారణ సమాచారం ఫైల్‌లో ఉన్న ప్లాన్ కవరేజ్ నియమానికి సరిపోలడం లేదు.',
    reasonBundled: 'ఈ సేవ మరో చెల్లింపులో ఇప్పటికే కలిసివుండవచ్చు మరియు ప్రొవైడర్ ఫాలోఅప్ అవసరమవచ్చు.',
    reasonFilingLimit: 'ప్రొవైడర్ ఫైలింగ్ గడువు తర్వాత క్లెయిమ్ సమర్పించినందున ప్లాన్ దీన్ని తుది ఫలితంగా పరిగణించింది.',
    reasonDeductible: 'ఈ మొత్తం ప్రస్తుతం ప్లాన్ చెల్లించబడకుండా డిడక్టిబుల్‌కు వర్తింపజేయబడింది.',
    reasonCoinsurance: 'క్లెయిమ్ ప్రాసెస్ అయ్యింది, కానీ కోఇన్ష్యూరెన్స్ మొత్తం ఇంకా సభ్యుడి బాధ్యతగా ఉంది.',
    reasonInReview: 'ఈ క్లెయిమ్ ఇంకా ప్లాన్ సమీక్షలో ఉంది.',
    reasonPaid: 'ఈ క్లెయిమ్ ప్రాసెసింగ్ ఇప్పటికే పూర్తైంది.',
    reasonDeniedGeneric: 'ఈ క్లెయిమ్ తిరస్కరించబడింది మరియు ఇంకా ఫాలోఅప్ అవసరం.',
    nextReferral: 'అవసరమైన రిఫరల్ సమర్పించమని ప్రాథమిక సంరక్షణ వైద్యుడు లేదా ప్రొవైడర్‌ను అడగండి.',
    nextPriorAuth: 'సమీక్ష పూర్తి కావడానికి ముందు ప్రొవైడర్ ముందస్తు అనుమతిని సమర్పించి పొందాలి.',
    nextModifier: '{{providerName}} సరైన మోడిఫైయర్‌తో క్లెయిమ్‌ను మళ్లీ సమర్పించాలి.',
    nextFixable: 'క్లెయిమ్ వివరాలను పరిశీలించండి మరియు మరిన్ని పత్రాలు అవసరమైతే ప్రొవైడర్‌ను సంప్రదించండి.',
    nextWait: 'స్థితి మారకపోతే ప్లాన్ సమీక్ష కోసం వేచి ఉండండి.',
    nextDone: 'ఇప్పుడే అదనపు చర్య అవసరం లేదు.',
    actorProviderPcm: 'ప్రొవైడర్ లేదా ప్రాథమిక సంరక్షణ వైద్యుడు',
    actorMemberProvider: 'సభ్యుడు మరియు ప్రొవైడర్',
    actorPlanTeam: 'ప్లాన్ సమీక్ష బృందం',
    actorNone: 'తక్షణ చర్య అవసరం లేదు',
  },
  Amharic: {
    helloClaim: 'ሰላም። ክሌም {{claimId}}ን አይቻለሁ።',
    helloGeneral: 'ሰላም። ስለ ክሌሞች፣ ሽፋን፣ ወጪ፣ ሪፈራል፣ ቅድመ ፈቃድ እና የተፈቀደ መዳረሻ መርዳት እችላለሁ።',
    statusLine: 'አሁን ያለው ሁኔታ {{status}} ነው።',
    reasonLine: 'ዋናው ምክንያት፦ {{reason}}',
    nextStepLine: 'ቀጣዩ እርምጃ፦ {{nextStep}}',
    actorLine: 'ቀጣይ መንቀሳቀስ ያለበት አካል፦ {{actor}}።',
    costLine: 'አሁን የሚገመተው የአባል ወጪ {{amount}} ነው።',
    coverageCovered: 'ይህ አገልግሎት በመዝገቡ ያሉ የእቅድ ደንቦች መሰረት ይሸፈናል።',
    coverageNotCovered: 'ይህ አገልግሎት በመዝገቡ ያሉ የእቅድ ደንቦች መሰረት እንደሚሸፈን አልተዘረዘረም።',
    coveragePriorAuthYes: 'ቅድመ ፈቃድ ያስፈልጋል።',
    coveragePriorAuthNo: 'ቅድመ ፈቃድ አያስፈልግም።',
    accessLine: 'በመዝገቡ ላይ {{count}} ንቁ የተፈቀዱ ግንኙነቶች አሉ፦ {{names}}።',
    noneListed: 'ምንም አልተዘረዘረም',
    generalLine: 'ለ {{memberName}} የክሌም ሁኔታ፣ ሽፋን፣ ወጪ፣ ቀጣይ እርምጃዎች እና የተፈቀደ መዳረሻን ማብራራት እችላለሁ።',
    reasonReferral: 'የሚያስፈልገው ሪፈራል እስካሁን በመዝገቡ ላይ የለም።',
    reasonPriorAuth: 'ቅድመ ፈቃድ ያስፈልጋል እና እስካሁን የተገኘ አይመስልም።',
    reasonModifier: 'አቅራቢው ኮዲንግ ወይም ሞዲፋየርን አስተካክሎ እንደገና ማስገባት ሊያስፈልገው ይችላል።',
    reasonCob: 'ይህን ክሌም ለማጠናቀቅ ከዚህ በፊት እቅዱ የጥቅማ ጥቅም ማስተባበሪያ መረጃ እንዲጨምር ይፈልጋል።',
    reasonDiagnosis: 'ከዚህ አገልግሎት ጋር የተያያዘው የምርመራ መረጃ በመዝገቡ ያለው የእቅድ ሽፋን ደንብ ጋር አይጣጣምም።',
    reasonBundled: 'ይህ አገልግሎት ሌላ ክፍያ ውስጥ አስቀድሞ ተካትቶ ሊሆን ይችላል እና የአቅራቢ ተጨማሪ ክትትል ሊያስፈልገው ይችላል።',
    reasonFilingLimit: 'አቅራቢው ክሌሙን ከማስገባት የጊዜ ገደቡ በኋላ ላከው፣ ስለዚህ እቅዱ ይህን እንደ የመጨረሻ ውጤት ቆጠረው።',
    reasonDeductible: 'ይህ ክፍያ አሁን በእቅዱ ከመክፈል ይልቅ ወደ ዲዳክቲብል ተጨምሯል።',
    reasonCoinsurance: 'ክሌሙ ተሰርቷል፣ ግን የኮ-ኢንሹራንስ መጠን እንደ አባሉ ኃላፊነት ቀርቷል።',
    reasonInReview: 'ይህ ክሌም አሁንም በእቅዱ ግምገማ ላይ ነው።',
    reasonPaid: 'ይህ ክሌም አስቀድሞ ተጠናቋል።',
    reasonDeniedGeneric: 'ይህ ክሌም ተከልክሏል እና አሁንም ተጨማሪ ክትትል ያስፈልገዋል።',
    nextReferral: 'የሚያስፈልገውን ሪፈራል እንዲልኩ ዋና የጤና እንክብካቤ አቅራቢውን ወይም አቅራቢውን ይጠይቁ።',
    nextPriorAuth: 'ግምገማው ከመጠናቀቁ በፊት አቅራቢው ቅድመ ፈቃድ ማስገባትና ማግኘት አለበት።',
    nextModifier: '{{providerName}} ክሌሙን በትክክለኛው ሞዲፋየር እንደገና ማስገባት አለበት።',
    nextFixable: 'የክሌሙን ዝርዝር ይመልከቱ እና ተጨማሪ ሰነዶች ካስፈለጉ አቅራቢውን ያነጋግሩ።',
    nextWait: 'ሁኔታው ካልተለወጠ በስተቀር የእቅዱን ግምገማ ይጠብቁ።',
    nextDone: 'በአሁኑ ጊዜ ተጨማሪ እርምጃ አያስፈልግም።',
    actorProviderPcm: 'አቅራቢ ወይም ዋና የጤና እንክብካቤ አስተዳዳሪ',
    actorMemberProvider: 'አባል እና አቅራቢ',
    actorPlanTeam: 'የእቅድ ግምገማ ቡድን',
    actorNone: 'አስቸኳይ እርምጃ የለም',
  },
  Spanish: {
    helloClaim: 'Hola. Revisé la reclamación {{claimId}}.',
    helloGeneral: 'Hola. Puedo ayudar con reclamaciones, cobertura, costos, remisiones, autorización previa y acceso autorizado.',
    statusLine: 'El estado actual es {{status}}.',
    reasonLine: 'La razón principal es: {{reason}}',
    nextStepLine: 'El siguiente paso es: {{nextStep}}',
    actorLine: 'La siguiente parte que debe actuar es: {{actor}}.',
    costLine: 'El costo estimado actual para el miembro es {{amount}}.',
    coverageCovered: 'Este servicio está cubierto según las reglas del plan registradas.',
    coverageNotCovered: 'Este servicio no figura como cubierto según las reglas del plan registradas.',
    coveragePriorAuthYes: 'Se requiere autorización previa.',
    coveragePriorAuthNo: 'No se requiere autorización previa.',
    accessLine: 'Hay {{count}} contactos autorizados activos en el expediente: {{names}}.',
    noneListed: 'ninguno registrado',
    generalLine: 'Puedo explicar el estado de la reclamación, la cobertura, los costos, los siguientes pasos y el acceso autorizado para {{memberName}}.',
    reasonReferral: 'La remisión requerida todavía no está registrada.',
    reasonPriorAuth: 'La autorización previa es obligatoria y no aparece como obtenida todavía.',
    reasonModifier: 'Es probable que el proveedor deba corregir el código o modificador y reenviar la reclamación.',
    reasonCob: 'El plan todavía necesita datos de coordinación de beneficios antes de terminar esta reclamación.',
    reasonDiagnosis: 'El diagnóstico adjunto al servicio no coincide con la regla de cobertura registrada del plan.',
    reasonBundled: 'Este servicio puede ya estar incluido en otro pago y quizá necesite seguimiento del proveedor.',
    reasonFilingLimit: 'El proveedor presentó la reclamación después del plazo límite, por eso el plan la trató como final.',
    reasonDeductible: 'El cargo se aplicó al deducible en lugar de que el plan lo pagara ahora.',
    reasonCoinsurance: 'La reclamación se procesó, pero queda un monto de coseguro como responsabilidad del miembro.',
    reasonInReview: 'La reclamación sigue en revisión del plan.',
    reasonPaid: 'La reclamación ya terminó su procesamiento.',
    reasonDeniedGeneric: 'La reclamación está denegada y todavía necesita seguimiento.',
    nextReferral: 'Pide al médico primario o al proveedor que envíe la remisión requerida.',
    nextPriorAuth: 'El proveedor debe enviar y obtener la autorización previa antes de que termine la revisión.',
    nextModifier: '{{providerName}} debe reenviar la reclamación con el modificador correcto.',
    nextFixable: 'Revisa los detalles de la reclamación y contacta al proveedor si se necesitan más documentos.',
    nextWait: 'Espera la revisión del plan salvo que cambie el estado.',
    nextDone: 'No se requiere ninguna acción adicional por ahora.',
    actorProviderPcm: 'Proveedor o médico primario',
    actorMemberProvider: 'Miembro y proveedor',
    actorPlanTeam: 'Equipo de revisión del plan',
    actorNone: 'Sin acción inmediata',
  },
  Nepali: {
    helloClaim: 'नमस्ते। मैले दाबी {{claimId}} हेरेँ।',
    helloGeneral: 'नमस्ते। म दाबी, कभरेज, खर्च, रेफरल, पूर्व-अनुमोदन, र अधिकृत पहुँचबारे मद्दत गर्न सक्छु।',
    statusLine: 'हालको स्थिति {{status}} हो।',
    reasonLine: 'मुख्य कारण यो हो: {{reason}}',
    nextStepLine: 'अर्को कदम यो हो: {{nextStep}}',
    actorLine: 'अब काम गर्नुपर्ने पक्ष: {{actor}}।',
    costLine: 'हाल अनुमानित सदस्य खर्च {{amount}} हो।',
    coverageCovered: 'यो सेवा फाइलमा भएको योजना नियमअनुसार कभर गरिएको छ।',
    coverageNotCovered: 'यो सेवा फाइलमा भएको योजना नियमअनुसार कभर गरिएको छैन।',
    coveragePriorAuthYes: 'पूर्व-अनुमोदन आवश्यक छ।',
    coveragePriorAuthNo: 'पूर्व-अनुमोदन आवश्यक छैन।',
    accessLine: 'फाइलमा {{count}} सक्रिय अधिकृत सम्पर्क छन्: {{names}}।',
    noneListed: 'कुनै पनि सूचीकृत छैन',
    generalLine: 'म {{memberName}} का लागि दाबीको स्थिति, कभरेज, खर्च, अर्को कदम, र अधिकृत पहुँचबारे बुझाउन सक्छु।',
    reasonReferral: 'आवश्यक रेफरल अझै फाइलमा छैन।',
    reasonPriorAuth: 'पूर्व-अनुमोदन आवश्यक छ र यो अझै प्राप्त भएको देखिँदैन।',
    reasonModifier: 'प्रदायकले कोडिङ वा समायोजन चिन्ह सच्याएर फेरि पेश गर्नुपर्ने सम्भावना छ।',
    reasonCob: 'यो दाबी पूरा गर्न योजनालाई अझै लाभ-समन्वयसम्बन्धी विवरण चाहिएको छ।',
    reasonDiagnosis: 'सेवासँग जोडिएको निदान विवरण फाइलमा रहेको योजना नियमसँग मेल खाँदैन।',
    reasonBundled: 'यो सेवा अर्को भुक्तानीमै समावेश भएको हुन सक्छ र प्रदायकको थप फलो-अप चाहिन सक्छ।',
    reasonFilingLimit: 'प्रदायकले समयसीमा पछि दाबी बुझाएकाले योजनाले यसलाई अन्तिम मानेको छ।',
    reasonDeductible: 'यो शुल्क अहिले योजनाले तिर्नुको सट्टा कटौतीयोग्य रकममा लगाइएको छ।',
    reasonCoinsurance: 'दाबी प्रक्रिया भयो, तर सहभुक्तानीको रकम सदस्यकै जिम्मेवारीमा बाँकी छ।',
    reasonInReview: 'यो दाबी अझै योजना समीक्षामा छ।',
    reasonPaid: 'यो दाबीको प्रक्रिया पूरा भइसकेको छ।',
    reasonDeniedGeneric: 'यो दाबी अस्वीकृत छ र अझै फलो-अप चाहिन्छ।',
    nextReferral: 'प्राथमिक हेरचाह प्रबन्धक वा प्रदायकलाई आवश्यक रेफरल पठाउन भन्नुहोस्।',
    nextPriorAuth: 'समीक्षा पूरा हुनुअघि प्रदायकले पूर्व-अनुमोदन बुझाएर स्वीकृत गराउनुपर्छ।',
    nextModifier: '{{providerName}} ले सही समायोजन चिन्हसहित दाबी फेरि पेश गर्नुपर्छ।',
    nextFixable: 'दाबीको विवरण हेर्नुहोस् र थप कागजात चाहिएको भए प्रदायकसँग सम्पर्क गर्नुहोस्।',
    nextWait: 'स्थिति नबद्लिएसम्म योजना समीक्षाको प्रतीक्षा गर्नुहोस्।',
    nextDone: 'अहिले थप काम आवश्यक छैन।',
    actorProviderPcm: 'प्रदायक वा प्राथमिक हेरचाह प्रबन्धक',
    actorMemberProvider: 'सदस्य र प्रदायक',
    actorPlanTeam: 'योजना समीक्षा टोली',
    actorNone: 'तुरुन्तै काम आवश्यक छैन',
  },
  Hindi: {
    helloClaim: 'नमस्ते। मैंने दावा {{claimId}} देखा है।',
    helloGeneral: 'नमस्ते। मैं दावों, कवरेज, लागत, रेफ़रल, पूर्व-अनुमोदन और अधिकृत पहुँच में मदद कर सकता हूँ।',
    statusLine: 'वर्तमान स्थिति {{status}} है।',
    reasonLine: 'मुख्य कारण यह है: {{reason}}',
    nextStepLine: 'अगला कदम यह है: {{nextStep}}',
    actorLine: 'अब कार्रवाई करने वाली पक्ष: {{actor}}।',
    costLine: 'वर्तमान अनुमानित सदस्य लागत {{amount}} है।',
    coverageCovered: 'यह सेवा फ़ाइल में मौजूद योजना नियमों के अनुसार कवर है।',
    coverageNotCovered: 'यह सेवा फ़ाइल में मौजूद योजना नियमों के अनुसार कवर नहीं है।',
    coveragePriorAuthYes: 'पूर्व-अनुमोदन आवश्यक है।',
    coveragePriorAuthNo: 'पूर्व-अनुमोदन आवश्यक नहीं है।',
    accessLine: 'रिकॉर्ड में {{count}} सक्रिय अधिकृत संपर्क मौजूद हैं: {{names}}।',
    noneListed: 'कोई सूचीबद्ध नहीं',
    generalLine: 'मैं {{memberName}} के लिए दावा स्थिति, कवरेज, लागत, अगले कदम और अधिकृत पहुँच समझा सकता हूँ।',
    reasonReferral: 'आवश्यक रेफ़रल अभी रिकॉर्ड में नहीं है।',
    reasonPriorAuth: 'पूर्व-अनुमोदन आवश्यक है और यह अभी प्राप्त हुआ नहीं दिखता।',
    reasonModifier: 'संभावना है कि प्रदाता को कोडिंग या समायोजन चिह्न ठीक करके दावा दोबारा भेजना होगा।',
    reasonCob: 'इस दावे को पूरा करने से पहले योजना को अभी लाभ-समन्वय से जुड़ी जानकारी चाहिए।',
    reasonDiagnosis: 'सेवा से जुड़ा निदान विवरण फ़ाइल में मौजूद योजना कवरेज नियम से मेल नहीं खाता।',
    reasonBundled: 'यह सेवा शायद किसी दूसरे भुगतान में पहले से शामिल हो और प्रदाता फॉलो-अप की ज़रूरत हो।',
    reasonFilingLimit: 'प्रदाता ने दावा समय-सीमा के बाद भेजा, इसलिए योजना ने इसे अंतिम माना।',
    reasonDeductible: 'यह शुल्क अभी योजना द्वारा भुगतान होने के बजाय कटौती योग्य राशि में जोड़ा गया है।',
    reasonCoinsurance: 'दावा प्रोसेस हो गया, लेकिन सह-बीमा की राशि सदस्य की ज़िम्मेदारी में बाकी है।',
    reasonInReview: 'यह दावा अभी योजना समीक्षा में है।',
    reasonPaid: 'इस दावे की प्रोसेसिंग पूरी हो चुकी है।',
    reasonDeniedGeneric: 'यह दावा अस्वीकृत है और अभी फॉलो-अप की ज़रूरत है।',
    nextReferral: 'प्राथमिक देखभाल प्रबंधक या प्रदाता से आवश्यक रेफ़रल जमा करने के लिए कहें।',
    nextPriorAuth: 'समीक्षा पूरी होने से पहले प्रदाता को पूर्व-अनुमोदन जमा कराकर प्राप्त करना होगा।',
    nextModifier: '{{providerName}} को सही समायोजन चिह्न के साथ दावा दोबारा भेजना चाहिए।',
    nextFixable: 'दावे का विवरण देखें और यदि अधिक दस्तावेज़ चाहिए हों तो प्रदाता से संपर्क करें।',
    nextWait: 'स्थिति बदलने तक योजना समीक्षा की प्रतीक्षा करें।',
    nextDone: 'अभी किसी अतिरिक्त कार्रवाई की आवश्यकता नहीं है।',
    actorProviderPcm: 'प्रदाता या प्राथमिक देखभाल प्रबंधक',
    actorMemberProvider: 'सदस्य और प्रदाता',
    actorPlanTeam: 'योजना समीक्षा टीम',
    actorNone: 'तुरंत कोई कार्रवाई नहीं',
  },
  Korean: {
    helloClaim: '안녕하세요. 청구 {{claimId}}를 확인했습니다.',
    helloGeneral: '안녕하세요. 청구, 보장, 비용, 의뢰서, 사전 승인, 승인된 접근에 대해 도와드릴 수 있습니다.',
    statusLine: '현재 상태는 {{status}}입니다.',
    reasonLine: '주된 이유는 다음과 같습니다: {{reason}}',
    nextStepLine: '다음 단계는 다음과 같습니다: {{nextStep}}',
    actorLine: '다음으로 조치해야 하는 쪽은 {{actor}}입니다.',
    costLine: '현재 예상 회원 부담금은 {{amount}}입니다.',
    coverageCovered: '이 서비스는 등록된 플랜 규정상 보장됩니다.',
    coverageNotCovered: '이 서비스는 등록된 플랜 규정상 보장되는 것으로 보이지 않습니다.',
    coveragePriorAuthYes: '사전 승인이 필요합니다.',
    coveragePriorAuthNo: '사전 승인은 필요하지 않습니다.',
    accessLine: '기록상 활성 승인 연락처는 {{count}}명입니다: {{names}}.',
    noneListed: '등록된 연락처 없음',
    generalLine: '{{memberName}}님의 청구 상태, 보장, 비용, 다음 단계, 승인된 접근을 설명할 수 있습니다.',
    reasonReferral: '필수 의뢰서가 아직 기록에 없습니다.',
    reasonPriorAuth: '사전 승인이 필요하지만 아직 획득된 것으로 보이지 않습니다.',
    reasonModifier: '제공자가 코딩 또는 수식자를 수정해 다시 제출해야 할 가능성이 큽니다.',
    reasonCob: '이 청구를 마무리하려면 플랜에 아직 추가 보험 조정 정보가 더 필요합니다.',
    reasonDiagnosis: '서비스에 연결된 진단 정보가 등록된 플랜 보장 규칙과 일치하지 않습니다.',
    reasonBundled: '이 서비스는 다른 지급에 이미 포함되었을 수 있어 제공자 후속 조치가 필요할 수 있습니다.',
    reasonFilingLimit: '제공자가 마감 기한 이후에 청구를 제출해 플랜이 이를 최종으로 처리했습니다.',
    reasonDeductible: '이 금액은 현재 플랜 지급 대신 공제액에 적용되었습니다.',
    reasonCoinsurance: '청구는 처리되었지만 공동보험 금액은 회원 책임으로 남아 있습니다.',
    reasonInReview: '이 청구는 아직 플랜 검토 중입니다.',
    reasonPaid: '이 청구는 이미 처리가 완료되었습니다.',
    reasonDeniedGeneric: '이 청구는 거절되었으며 후속 조치가 더 필요합니다.',
    nextReferral: '주치의나 제공자에게 필요한 의뢰서를 제출해 달라고 요청하세요.',
    nextPriorAuth: '검토가 끝나기 전에 제공자가 사전 승인을 제출하고 승인받아야 합니다.',
    nextModifier: '{{providerName}}가 올바른 수정 표기와 함께 청구를 다시 제출해야 합니다.',
    nextFixable: '청구 세부사항을 검토하고 추가 문서가 필요하면 제공자에게 연락하세요.',
    nextWait: '상태가 바뀌지 않는 한 플랜 검토를 기다리세요.',
    nextDone: '지금은 추가 조치가 필요하지 않습니다.',
    actorProviderPcm: '제공자 또는 주치의',
    actorMemberProvider: '회원과 제공자',
    actorPlanTeam: '플랜 검토팀',
    actorNone: '즉시 조치 없음',
  },
  Vietnamese: {
    helloClaim: 'Xin chào. Tôi đã xem yêu cầu {{claimId}}.',
    helloGeneral: 'Xin chào. Tôi có thể hỗ trợ về yêu cầu bồi thường, quyền lợi, chi phí, giấy giới thiệu, phê duyệt trước và quyền truy cập được ủy quyền.',
    statusLine: 'Trạng thái hiện tại là {{status}}.',
    reasonLine: 'Lý do chính là: {{reason}}',
    nextStepLine: 'Bước tiếp theo là: {{nextStep}}',
    actorLine: 'Bên cần hành động tiếp theo là: {{actor}}.',
    costLine: 'Chi phí thành viên ước tính hiện tại là {{amount}}.',
    coverageCovered: 'Dịch vụ này được chi trả theo quy tắc quyền lợi hiện có trong hồ sơ.',
    coverageNotCovered: 'Dịch vụ này không được liệt kê là được chi trả theo quy tắc quyền lợi hiện có trong hồ sơ.',
    coveragePriorAuthYes: 'Cần phê duyệt trước.',
    coveragePriorAuthNo: 'Không cần phê duyệt trước.',
    accessLine: 'Hiện có {{count}} liên hệ được ủy quyền đang hoạt động trong hồ sơ: {{names}}.',
    noneListed: 'không có mục nào',
    generalLine: 'Tôi có thể giải thích trạng thái yêu cầu, quyền lợi, chi phí, bước tiếp theo và quyền truy cập được ủy quyền cho {{memberName}}.',
    reasonReferral: 'Giấy giới thiệu bắt buộc vẫn chưa có trong hồ sơ.',
    reasonPriorAuth: 'Phê duyệt trước là bắt buộc và có vẻ vẫn chưa được lấy.',
    reasonModifier: 'Có khả năng nhà cung cấp cần sửa mã hoặc ký hiệu điều chỉnh rồi gửi lại yêu cầu.',
    reasonCob: 'Chương trình vẫn cần thêm thông tin phối hợp quyền lợi trước khi hoàn tất yêu cầu này.',
    reasonDiagnosis: 'Thông tin chẩn đoán gắn với dịch vụ này không khớp với quy tắc chi trả trong hồ sơ.',
    reasonBundled: 'Dịch vụ này có thể đã được gộp trong một khoản thanh toán khác và có thể cần nhà cung cấp theo dõi thêm.',
    reasonFilingLimit: 'Nhà cung cấp nộp yêu cầu sau thời hạn nên chương trình xử lý đây là kết quả cuối cùng.',
    reasonDeductible: 'Khoản phí này đã được tính vào mức khấu trừ thay vì được chương trình thanh toán ngay bây giờ.',
    reasonCoinsurance: 'Yêu cầu đã được xử lý nhưng vẫn còn khoản đồng bảo hiểm thuộc trách nhiệm của thành viên.',
    reasonInReview: 'Yêu cầu này vẫn đang trong quá trình xem xét của chương trình.',
    reasonPaid: 'Yêu cầu này đã hoàn tất xử lý.',
    reasonDeniedGeneric: 'Yêu cầu này bị từ chối và vẫn cần theo dõi thêm.',
    nextReferral: 'Hãy yêu cầu bác sĩ chăm sóc chính hoặc nhà cung cấp gửi giấy giới thiệu bắt buộc.',
    nextPriorAuth: 'Nhà cung cấp cần nộp và được chấp thuận phê duyệt trước trước khi quá trình xem xét hoàn tất.',
    nextModifier: '{{providerName}} nên gửi lại yêu cầu với ký hiệu điều chỉnh chính xác.',
    nextFixable: 'Hãy xem chi tiết yêu cầu và liên hệ nhà cung cấp nếu cần thêm tài liệu.',
    nextWait: 'Hãy chờ chương trình xem xét trừ khi trạng thái thay đổi.',
    nextDone: 'Hiện chưa cần thêm hành động nào.',
    actorProviderPcm: 'Nhà cung cấp hoặc bác sĩ chăm sóc chính',
    actorMemberProvider: 'Thành viên và nhà cung cấp',
    actorPlanTeam: 'Nhóm xem xét của chương trình',
    actorNone: 'Không cần hành động ngay',
  },
} as const

export function hasLocalAssistantTranslation(language: SupportedLanguage): boolean {
  return Object.prototype.hasOwnProperty.call(TRANSLATIONS, language)
}

function resolveLocalAssistantLanguage(language: SupportedLanguage): SupportedLanguage {
  return hasLocalAssistantTranslation(language) ? language : 'English'
}

function render(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{{${key}}}`, String(value)),
    template,
  )
}

function t(language: SupportedLanguage, key: keyof typeof TRANSLATIONS['English'], values: Record<string, string | number> = {}): string {
  const translationMap = TRANSLATIONS as Partial<Record<SupportedLanguage, Record<keyof typeof TRANSLATIONS['English'], string>>>
  const template = translationMap[language]?.[key] ?? TRANSLATIONS.English[key]
  return render(template, values)
}

function detectIntent(question: string, language: SupportedLanguage): LocalIntent {
  const normalized = question.trim().toLowerCase()
  const ordered: LocalIntent[] = ['hello', 'why', 'who', 'cost', 'coverage', 'access']
  for (const intent of ordered) {
    const terms = KEYWORDS[intent][language] ?? []
    if (terms.some((term) => normalized.includes(term.toLowerCase()))) {
      return intent
    }
  }
  for (const intent of ordered) {
    const terms = KEYWORDS[intent].English ?? []
    if (terms.some((term) => normalized.includes(term))) {
      return intent
    }
  }
  return 'general'
}

function localizedReason(context: ClaimContext, language: SupportedLanguage): string {
  if (!context.claim.referralOnFile) return t(language, 'reasonReferral')
  if (context.claim.priorAuthRequired && !context.claim.priorAuthObtained) return t(language, 'reasonPriorAuth')
  if (context.claim.modifierMismatch) return t(language, 'reasonModifier')
  switch (context.claim.denialReason) {
    case 'Claim not covered by this payer — coordination of benefits':
      return t(language, 'reasonCob')
    case 'Diagnosis not covered':
      return t(language, 'reasonDiagnosis')
    case 'Benefit included in payment for another service':
      return t(language, 'reasonBundled')
    case 'Time limit for filing has expired':
      return t(language, 'reasonFilingLimit')
    case 'Deductible amount':
      return t(language, 'reasonDeductible')
    case 'Coinsurance amount':
      return t(language, 'reasonCoinsurance')
    default:
      break
  }
  if (context.claim.rawStatus === 'Paid') return t(language, 'reasonPaid')
  if (context.claim.rawStatus === 'Pending' || context.claim.rawStatus === 'In Review') return t(language, 'reasonInReview')
  if (context.claim.rawStatus === 'Denied') return t(language, 'reasonDeniedGeneric')
  return context.claim.plainLanguageReason
}

function localizedNextStep(context: ClaimContext, language: SupportedLanguage): string {
  if (!context.claim.referralOnFile) return t(language, 'nextReferral')
  if (context.claim.priorAuthRequired && !context.claim.priorAuthObtained) return t(language, 'nextPriorAuth')
  if (context.claim.modifierMismatch) return t(language, 'nextModifier', { providerName: context.claim.providerName })
  if (context.claim.statusGroup === 'needs-action' && context.claim.denialFixable) return t(language, 'nextFixable')
  if (context.claim.rawStatus === 'Pending' || context.claim.rawStatus === 'In Review') return t(language, 'nextWait')
  return t(language, 'nextDone')
}

function localizedActor(context: ClaimContext, language: SupportedLanguage): string {
  if (!context.claim.referralOnFile) return t(language, 'actorProviderPcm')
  if (context.claim.priorAuthRequired && !context.claim.priorAuthObtained) return context.claim.providerName
  if (context.claim.modifierMismatch) return context.claim.providerName
  if (context.claim.statusGroup === 'needs-action' && context.claim.denialFixable) return t(language, 'actorMemberProvider')
  if (context.claim.rawStatus === 'Pending' || context.claim.rawStatus === 'In Review') return t(language, 'actorPlanTeam')
  return t(language, 'actorNone')
}

function coverageLine(context: ClaimContext, language: SupportedLanguage): string {
  if (!context.coverageRule) return ''
  const parts = [
    context.coverageRule.covered ? t(language, 'coverageCovered') : t(language, 'coverageNotCovered'),
    context.coverageRule.priorAuthRequired ? t(language, 'coveragePriorAuthYes') : t(language, 'coveragePriorAuthNo'),
  ]
  return parts.join(' ')
}

function summarizeClaim(context: ClaimContext, language: SupportedLanguage): string {
  return [
    t(language, 'helloClaim', { claimId: context.claim.id, serviceName: context.claim.serviceName }),
    t(language, 'statusLine', { status: translateStatusLabel(context.claim.statusLabel, language) }),
    t(language, 'reasonLine', { reason: localizedReason(context, language) }),
    t(language, 'nextStepLine', { nextStep: localizedNextStep(context, language) }),
  ].join(' ')
}

export function answerWithLocalData(params: {
  question: string
  language: SupportedLanguage
  member: Member
  context?: ClaimContext
}): string {
  return answerWithLocalDataResult(params).content
}

export function answerWithLocalDataResult(params: {
  question: string
  language: SupportedLanguage
  member: Member
  context?: ClaimContext
}): LocalAssistantReply {
  const { question, language, member, context } = params
  const intent = detectIntent(question, language)
  const resolvedLanguage = resolveLocalAssistantLanguage(language)

  if (!context) {
    if (intent === 'hello') {
      return { content: t(resolvedLanguage, 'helloGeneral'), language: resolvedLanguage }
    }
    return {
      content: t(resolvedLanguage, 'generalLine', { memberName: member.fullName }),
      language: resolvedLanguage,
    }
  }

  if (intent === 'hello') {
    return { content: summarizeClaim(context, resolvedLanguage), language: resolvedLanguage }
  }
  if (intent === 'who') {
    return {
      content: [
        t(resolvedLanguage, 'actorLine', { actor: localizedActor(context, resolvedLanguage) }),
        t(resolvedLanguage, 'nextStepLine', { nextStep: localizedNextStep(context, resolvedLanguage) }),
      ].join(' '),
      language: resolvedLanguage,
    }
  }
  if (intent === 'cost') {
    const coverage = coverageLine(context, resolvedLanguage)
    return {
      content: [t(resolvedLanguage, 'costLine', { amount: formatCurrency(context.claim.estimatedMemberCost) }), coverage]
        .filter(Boolean)
        .join(' '),
      language: resolvedLanguage,
    }
  }
  if (intent === 'coverage') {
    const coverage = coverageLine(context, resolvedLanguage)
    return {
      content: coverage || summarizeClaim(context, resolvedLanguage),
      language: resolvedLanguage,
    }
  }
  if (intent === 'access') {
    const names = context.roiAuthorizations.map((authorization) => authorization.authorizedCallerName).join(', ')
    return {
      content: t(resolvedLanguage, 'accessLine', {
        count: context.roiAuthorizations.length,
        names: names || t(resolvedLanguage, 'noneListed'),
      }),
      language: resolvedLanguage,
    }
  }
  if (intent === 'why') {
    return {
      content: [
        t(resolvedLanguage, 'statusLine', { status: translateStatusLabel(context.claim.statusLabel, resolvedLanguage) }),
        t(resolvedLanguage, 'reasonLine', { reason: localizedReason(context, resolvedLanguage) }),
        t(resolvedLanguage, 'actorLine', { actor: localizedActor(context, resolvedLanguage) }),
        t(resolvedLanguage, 'nextStepLine', { nextStep: localizedNextStep(context, resolvedLanguage) }),
      ].join(' '),
      language: resolvedLanguage,
    }
  }

  return {
    content: summarizeClaim(context, resolvedLanguage),
    language: resolvedLanguage,
  }
}
