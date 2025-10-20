export default function(css){
  const ss = new CSSStyleSheet();
  ss.replaceSync(css);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, ss];
}
