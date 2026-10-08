export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i=result.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
  return result;
}
export function choicesForStep(correct, total=7, random=Math.random) {
  const others=shuffled(Array.from({length:total},(_,i)=>i).filter(i=>i!==correct),random).slice(0,2);
  return shuffled([correct,...others],random);
}
export function reorderAfterMistake(choices, random=Math.random) {
  const offset=random()<0.5 ? 1 : 2;
  return [...choices.slice(offset),...choices.slice(0,offset)];
}

