import { unzipSync, strFromU8 } from 'fflate';
export async function parseBook(file) {
 const extension=file.name.split('.').pop().toLowerCase();
 const data=await file.arrayBuffer();
 let chapters=[];
 if(extension==='txt'){
  let text=new TextDecoder('utf-8',{fatal:false}).decode(data);
  if((text.match(/�/g)||[]).length>text.length*.01) text=new TextDecoder('gb18030').decode(data);
  chapters=[{title:'正文',text}];
 }else if(extension==='epub'){
  const files=unzipSync(new Uint8Array(data));
  const xml=s=>new DOMParser().parseFromString(s,'application/xml');
  const container=xml(strFromU8(files['META-INF/container.xml']));
  const path=container.getElementsByTagName('rootfile')[0]?.getAttribute('full-path');
  if(!path||!files[path])throw new Error('无法读取 EPUB 的书籍目录');
  const opf=xml(strFromU8(files[path]));
  const base=path.includes('/')?path.slice(0,path.lastIndexOf('/')+1):'';
  const items=new Map(Array.from(opf.getElementsByTagName('item')).map(el=>[el.getAttribute('id'),el.getAttribute('href')]));
  for(const ref of Array.from(opf.getElementsByTagName('itemref'))){
   const href=items.get(ref.getAttribute('idref'));if(!href)continue;
   const resolved=new URL(base+href,'https://epub.local/').pathname.slice(1);
   const content=files[decodeURIComponent(resolved)];if(!content)continue;
   const doc=new DOMParser().parseFromString(strFromU8(content),'text/html');
   doc.querySelectorAll('script,style,nav').forEach(el=>el.remove());
   const blocks=Array.from(doc.querySelectorAll('h1,h2,h3,p,li,blockquote')).map(el=>el.textContent.trim()).filter(Boolean);
   const text=blocks.join('\n\n')||doc.body.textContent.trim();
   if(text)chapters.push({title:doc.querySelector('h1,h2,h3,title')?.textContent.trim()||`第 ${chapters.length+1} 节`,text});
  }
 }else if(extension==='pdf'){
  const pdfjs=await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;
  const pdf=await pdfjs.getDocument({data,useSystemFonts:true}).promise;
  for(let i=1;i<=pdf.numPages;i++){
   const page=await pdf.getPage(i);const content=await page.getTextContent();
   chapters.push({title:`第 ${i} 页`,text:content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('')});
  }
  if(!chapters.some(c=>c.text.trim()))throw new Error('这份 PDF 没有可提取文字，扫描版 OCR 暂未支持');
 }else throw new Error('请上传 EPUB、PDF 或 TXT 文件');
 if(!chapters.length||!chapters.some(c=>c.text.trim()))throw new Error('书籍中没有可读取的正文');
 return {id:crypto.randomUUID(),title:file.name.replace(/\.[^.]+$/,''),author:'本地导入',format:extension.toUpperCase(),chapters,chapter:0,scroll:0,added:Date.now()};
}
export function segments(text, highlights){
 const points=new Set([0,text.length]);
 highlights.forEach(h=>{points.add(h.start);points.add(h.end)});
 const sorted=[...points].sort((a,b)=>a-b);
 return sorted.slice(0,-1).map((start,i)=>({start,end:sorted[i+1],text:text.slice(start,sorted[i+1]),marked:highlights.some(h=>h.start<=start&&h.end>=sorted[i+1])}));
}
