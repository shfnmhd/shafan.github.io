/* The preview is printed locally by the browser; no PDF service or upload. */
const policy = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; media-src 'none'";
const printCSS = `
@page { size: A4 portrait; margin: 12mm; }
@media print {
  html,body { margin: 0 !important; min-height: 0 !important; }
  *,*::before,*::after { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; animation:none !important; transition:none !important; }
  main,article,header,footer,section { max-width: 100%; }
  h1,h2,h3 { break-after: avoid; }
  p,li { orphans: 3; widows: 3; }
  img,svg,figure,.card,.preview-card,.feature-card,[data-print-keep] { break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  a { text-decoration: inherit; }
  [data-no-print] { display:none !important; }
}
`;
function fragment(markup, forHead) {
  // Template contents are parsed without creating an active browsing context.
  const inert = document.createElement("template");
  inert.innerHTML = markup;
  if(forHead) {
    for(const node of [...inert.content.childNodes]) {
      if(node.nodeType !== 1 || !["TITLE","STYLE"].includes(node.tagName)) node.remove();
    }
  }
  inert.content.querySelectorAll("script,iframe,frame,object,embed,link,base,meta,form,audio,video,source,foreignObject,animate,animateTransform,set,noscript,template").forEach(el=>el.remove());
  for(const node of inert.content.querySelectorAll("*")) {
    for(const attr of [...node.attributes]) {
      const key=attr.name.toLowerCase();
      if(key.startsWith("on") || ["srcdoc","srcset","ping","action","formaction","target","download","autofocus"].includes(key)) {
        node.removeAttribute(attr.name);
      } else if(["src","href","xlink:href","poster","background"].includes(key) && !/^(?:#|data:image\/(?:png|webp|jpeg);base64,)/i.test(attr.value)) {
        node.removeAttribute(attr.name);
      }
    }
  }
  return inert.innerHTML;
}
export function makePrintDocument(html) {
  if(typeof html !== "string" || html.length > 1_500_000) throw new Error("The printable page is unavailable.");
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i);
  const body = html.match(/<body\b([^>]*)>([\s\S]*?)<\/body\s*>/i);
  if(!head || !body) throw new Error("The printable page is incomplete.");
  const inert = document.createElement("template");
  inert.innerHTML = "<div"+body[1]+"></div>";
  const attrs = [...(inert.content.firstElementChild?.attributes || [])]
    .filter(({name})=>["class","id","style","dir","lang"].includes(name)||name.startsWith("data-"));
  const safeBody = document.createElement("body");
  for(const {name,value} of attrs) safeBody.setAttribute(name,value);
  safeBody.innerHTML = fragment(body[2],false);
  const lang = /<html\b[^>]*\blang\s*=\s*["']([a-z0-9-]+)["']/i.exec(html)?.[1] || "en";
  return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="'+policy+'">'+
    '<meta name="workspace-print-copy" content="ready">'+
    fragment(head[1],true)+'<style>'+printCSS+'</style></head>'+safeBody.outerHTML+'</html>';
}
let frame, fallback, fallbackURL, generation=0;
function clearPrevious() {
  frame?.remove();
  fallback?.remove();
  if(fallbackURL) URL.revokeObjectURL(fallbackURL);
  frame=fallback=null;
  fallbackURL=null;
}
export function printWorkspace(html) {
  const status = document.getElementById("print-status") || document.getElementById("status");
  const button = document.getElementById("editor-export-pdf");
  const tell = message=>{if(status) status.textContent=message;};
  let copy;
  try { copy=makePrintDocument(html); }
  catch { tell("Could not prepare the print copy. Download the HTML and print it from your browser instead."); return false; }
  const serial=++generation;
  clearPrevious();
  fallbackURL=URL.createObjectURL(new Blob([copy],{type:"text/html;charset=utf-8"}));
  fallback=document.createElement("a");
  fallback.className="button";
  fallback.textContent="Open print copy";
  fallback.href=fallbackURL;
  fallback.target="_blank";
  fallback.rel="noopener";
  fallback.title="Open the preview alone, then print from your browser menu";
  if(status) status.after(fallback);
  else if(button) button.after(fallback);
  else document.body.append(fallback);
  const view=document.createElement("iframe");
  frame=view;
  view.title="Print-only workspace preview";
  view.setAttribute("sandbox","allow-same-origin allow-modals");
  view.setAttribute("aria-hidden","true");
  view.tabIndex=-1;
  // Don't display:none: browsers may omit a hidden frame from the print job.
  view.style.cssText="position:fixed;left:-10000px;top:0;width:900px;height:1000px;border:0;pointer-events:none;";
  tell("In the print dialog, choose Save as PDF. If no dialog opens, use Open print copy, then Print.");
  let attempted=false;
  view.addEventListener("load",()=>{
    if(serial!==generation || attempted)return;
    try{
      const preview=view.contentWindow;
      if(!preview?.document.querySelector('meta[name="workspace-print-copy"]'))return;
      attempted=true;
      if(typeof preview.print!=="function")return;
      preview.addEventListener("afterprint",()=>{
        if(serial===generation){
          window.setTimeout(()=>{view.remove();if(frame===view)frame=null;},100);
          button?.focus({preventScroll:true});
        }
      },{once:true});
      preview.focus();
      preview.print();
    }catch{
      tell("This browser did not open the print dialog. Open the print copy and use Print, then Save as PDF.");
    }
  });
  view.srcdoc=copy;
  document.body.append(view);
  return true;
}
window.addEventListener("pagehide",clearPrevious);

document.getElementById("editor-export-pdf")?.addEventListener("click",()=>{
  const editor=window.SHFNWorkspace;
  if(editor?.getHTML) printWorkspace(editor.getHTML());
  else {
    const status=document.getElementById("print-status");
    if(status) status.textContent="The editor is still loading. Try Save as PDF again.";
  }
});

