import {test,expect} from '@playwright/test';
import {zipSync,strToU8} from 'fflate';
test('import, direct highlight, persist, navigate and delete',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:'在文字里，遇见更大的世界。'})).toBeVisible();
 await page.locator('#upload').setInputFiles({name:'测试书籍.txt',mimeType:'text/plain',buffer:Buffer.from('这是一本用于验证的书籍。\n\n阅读让思想留下痕迹。')});
 await page.getByRole('button',{name:'阅读 测试书籍',exact:true}).click();
 await page.getByRole('button',{name:'划线模式'}).click();
 const p=page.locator('#prose');const box=await p.boundingBox();
 await page.mouse.move(box.x+2,box.y+20);await page.mouse.down();await page.mouse.move(box.x+160,box.y+20,{steps:15});await page.mouse.up();
 await expect(p.locator('mark')).toHaveCount(1);
 await page.reload();await page.getByRole('button',{name:'阅读 测试书籍',exact:true}).click();await expect(page.locator('#prose mark')).toHaveCount(1);
 await page.getByRole('button',{name:'划线摘录'}).click();await expect(page.locator('.quote-card')).toHaveCount(1);
 await page.locator('[data-jump]').click();await expect(page.locator('#prose mark')).toBeVisible();
 await page.getByRole('button',{name:'删除划线',exact:true}).click();await expect(page.locator('#prose mark')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('EPUB reading order and safe imported text',async({page})=>{
 const zip=zipSync({'META-INF/container.xml':strToU8('<container><rootfiles><rootfile full-path="OEBPS/book.opf"/></rootfiles></container>'),'OEBPS/book.opf':strToU8('<package><manifest><item id="c1" href="chapter.xhtml"/></manifest><spine><itemref idref="c1"/></spine></package>'),'OEBPS/chapter.xhtml':strToU8('<html><head><title>第一章</title></head><body><h1>第一章</h1><p>书中的第一段文字。</p><script>window.hacked=true</script></body></html>')});
 await page.goto('/');await page.locator('#upload').setInputFiles({name:'测试EPUB.epub',mimeType:'application/epub+zip',buffer:Buffer.from(zip)});await page.getByRole('button',{name:'阅读 测试EPUB',exact:true}).click();await expect(page.locator('#prose')).toContainText('书中的第一段文字。');expect(await page.evaluate(()=>window.hacked)).toBeUndefined();
});
test('sample chapters and small screen',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');await page.screenshot({path:'/tmp/moye-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.locator('#open-sample').click();await page.locator('#next').click();await expect(page.locator('.reading-page h1')).toHaveText('第二章　让思考留下痕迹');await page.reload();await page.getByRole('button',{name:'阅读 阅读的回响',exact:true}).click();await expect(page.locator('.reading-page h1')).toHaveText('第二章　让思考留下痕迹')});
test('PDF text import',async({page})=>{
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 const stream='BT /F1 18 Tf 50 700 Td (Reading helps us think.) Tj ET';objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
 let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});const xref=pdf.length;pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 await page.goto('/');await page.locator('#upload').setInputFiles({name:'PDF sample.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});await page.getByRole('button',{name:'阅读 PDF sample',exact:true}).click();await expect(page.locator('#prose')).toContainText('Reading helps us think.');
});
test('desktop bookshelf',async({page})=>{await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.locator('#open-sample').click();await page.locator('#back').click();await page.screenshot({path:'/tmp/moye-desktop.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()});
