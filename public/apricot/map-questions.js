// Explicitly authored examples, not embeddings calculated from arbitrary text.
export const mapQuestions=[
 {id:'bags',text:'How heavy can my cabin bag be?',alternate:'What is the carry-on weight limit?',x:20,y:30,source:1,answer:'One cabin bag up to 8 kg. [1]'},
 {id:'flight-refund',text:'When can I cancel a flexible airline ticket for a refund?',alternate:'What is the refund deadline for my flexible flight?',x:43,y:43,source:2,answer:'Cancel a flexible airline ticket at least 24 hours before departure for a refund. [2]'},
 {id:'seats',text:'When do I choose my seat?',alternate:'Should I select my seat before paying?',x:22,y:65,source:3,answer:'Choose your seat before paying when booking through the airline website. [3]'},
 {id:'check-in',text:'What time is my hotel room available?',alternate:'When can I check in at the hotel?',x:81,y:21,source:4,answer:'Your hotel room is available from 15:00. [4]'},
 {id:'hotel-refund',text:'When must I cancel my refundable hotel booking?',alternate:'What is the cancellation deadline for a refundable room?',x:83,y:55,source:5,answer:'For a refundable hotel booking, cancel at least 48 hours before check-in. [5]'},
 {id:'dinner',text:'Are vegetarian meals available?',alternate:'Can I get a vegetarian meal at dinner?',x:64,y:83,source:6,answer:'Vegetarian meals are available. [6]'},
 {id:'pets',text:'Can my pet fly in the cabin?',alternate:'Are animals allowed in the aircraft cabin?',x:20,y:30,source:null,answer:null}
];
export function explainMapAnswer(question,{context,decisions}){
 const good=context.some(d=>d.id===question.source),old=question.id==='bags'&&context.some(d=>d.id===7);
 if(old&&good)return {state:'Conflicting evidence',answer:'Conflicting limits: 8 kg [1] and 12 kg [7]. Check which policy is current.',why:'Both versions entered context. Exclude the outdated policy before relying on the limit.'};
 if(old)return {state:'Outdated evidence',answer:'The only supplied bag limit is 12 kg [7], but that policy is outdated. No current limit is supported by this context.',why:'Similarity found an old rule. Filter outdated policies and retrieve the current rule [1].'};
 if(good)return {state:'Supported by the supplied policy',answer:question.answer,why:'Passage ['+question.source+'] reached the context and supports this answer. These are fictional travel policies, not real travel advice.'};
 if(question.source===null)return {state:'Policy missing from this collection',answer:'No supplied passage describes a pet allowance. Retrieve a pet policy or ask the airline.',why:'There is no pet policy anywhere in this collection. A larger search radius or context window cannot create the missing information.'};
 const decision=decisions.find(d=>d.id===question.source);
 const reasons={'Outside search reach':'The supporting rule is outside the search circle. Restore the question position or increase search reach.','Beyond top-k limit':'The supporting rule lost its place at the top-k cutoff. Increase the passage limit or improve the query position.','Does not fit remaining capacity':'The supporting rule was retrieved, but did not fit the remaining context. Reduce irrelevant candidates or increase capacity.','Outdated policy':'The supporting passage was removed by the policy filter.'};
 return {state:'Evidence did not reach the answer',answer:'The supplied passages do not answer this question.',why:'The answer exists in passage ['+question.source+'], but it is not in context. '+(reasons[decision?.reason]||'Check the retrieval settings.')};
}
