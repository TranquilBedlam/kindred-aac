// Adult-access helpers; a convenience lock, not a security boundary.
export const validPin=pin=>/^\d{4,8}$/.test(pin);
export const verifyChallenge=(a,b,input)=> /^\d+$/.test(String(input).trim())&&Number(input)===a+b;
export const createChallenge=()=>({a:6+Math.floor(Math.random()*10),b:4+Math.floor(Math.random()*9)});
export async function pinDigest(pin,salt){
 const bytes=new TextEncoder().encode(`${salt}:${pin}`);
 const result=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(result)].map(b=>b.toString(16).padStart(2,'0')).join('');
}