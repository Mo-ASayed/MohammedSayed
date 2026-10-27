export const fitPoints=[{x:0,y:1.2},{x:1,y:2.1},{x:2,y:4},{x:3,y:4.9},{x:4,y:6.8},{x:5,y:7.8}];
export function fittingData(outlier=false){return fitPoints.map((p,i)=>({...p,y:outlier&&i===5?2:p.y}));}
export const predictLine=(x,slope,offset)=>offset+slope*x/5;
export function lineLoss(data,slope,offset){return data.reduce((sum,p)=>sum+(predictLine(p.x,slope,offset)-p.y)**2,0)/data.length;}
export function trainStep(data,slope,offset){
 let dm=0,db=0;
 for(const p of data){const error=predictLine(p.x,slope,offset)-p.y;dm+=2*error*p.x/5/data.length;db+=2*error/data.length;}
 return {slope:slope-.12*dm,offset:offset-.12*db};
}
export const words=['quiet','sunny','cold','purple','triangular'];
const logits=[3,2.5,2,1,.2];
export function wordProbabilities(temperature=1,k=5){
 const weights=logits.map((l,i)=>i<k?Math.exp((l-logits[0])/temperature):0),total=weights.reduce((a,b)=>a+b,0);
 return weights.map(w=>w/total);
}
export function sampleWord(probabilities,ticket){let cumulative=0;for(let i=0;i<probabilities.length;i++){cumulative+=probabilities[i];if(ticket<cumulative)return i;}return probabilities.findLastIndex(p=>p>0);}
export function seededTickets(count,seed=731){let value=seed;return Array.from({length:count},()=>{value=(Math.imul(1664525,value)+1013904223)>>>0;return value/4294967296;});}
export const referenceInputs=Array.from({length:40},(_,i)=>.3+i*.24);
export function driftBatch(kind,shift){return referenceInputs.map(x=>{const input=kind==='inputs'?x+shift:x;return {x:input,label:input>=(kind==='rule'?5+shift:5)?1:0};});}
export function scoreBatch(data,threshold=5){let tp=0,tn=0,fp=0,fn=0;for(const p of data){const positive=p.x>=threshold;if(positive&&p.label)tp++;else if(positive)fp++;else if(p.label)fn++;else tn++;}return {tp,tn,fp,fn,accuracy:(tp+tn)/data.length};}
export function histogram(data){const bins=Array(14).fill(0);data.forEach(p=>{const b=Math.floor(p.x+2);if(b>=0&&b<bins.length)bins[b]++;});return bins;}
