// Follow the visible disclosure controls before interacting with optional tools.
export async function click(page, selector, first=false) {
 let target=page.locator(selector);if(first)target=target.first();
 const parents=await target.locator('xpath=ancestor::details[not(@open)]').all();
 for(const parent of parents)await parent.locator(':scope > summary').click();
 await target.click();
}
export async function savedXP(page){return page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('apricot-workshop-v1'));return (s?.wins.length||0)*100+Object.values(s?.mastery||{}).reduce((a,b)=>a+b*50,0);});}
