export function lossTrace(values){
 const max=Math.max(...values,.01),points=values.map((v,i)=>(20+i*360/Math.max(1,values.length-1))+','+(100-v/max*80)).join(' ');
 return `<figure class="loss-trace"><figcaption>Recent training loss <span>${values.at(-1).toFixed(3)} MSE</span></figcaption><svg viewBox="0 0 400 125" role="img" aria-label="${values.length} recorded losses, from ${values[0].toFixed(3)} to ${values.at(-1).toFixed(3)}"><path d="M20 15V100H380" class="chart-axis"/><polyline points="${points}" class="fitted-line"/><text x="20" y="119">Earlier steps</text><text x="380" y="119" text-anchor="end">Now</text></svg><small>Same data, successive training steps. Changing a label or manually adjusting the line starts a fresh trace.</small></figure>`;
}
