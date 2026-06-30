function getStyleTagClass(style) {
  const normalized = (style || "").toString().trim().toLowerCase();
  switch (normalized) {
    case "trừu tượng":
      return "style-tag style-tag-abstract";
    case "hiện đại":
      return "style-tag style-tag-modern";
    case "cổ điển":
      return "style-tag style-tag-classic";
    case "tối giản":
      return "style-tag style-tag-minimal";
    default:
      return "style-tag style-tag-default";
  }
}

function renderStyleTag(style) {
  if (!style) return "";
  const cls = getStyleTagClass(style);
  return `<span class="${cls}">${style}</span>`;
}

window.getStyleTagClass = getStyleTagClass;
window.renderStyleTag = renderStyleTag;
