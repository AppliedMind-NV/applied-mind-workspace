useEffect(() => {
  if (!editor) return;

  const safeContent = content && content.type === "doc" ? content : { type: "doc", content: [] };

  console.log("🔥 Updating editor:", safeContent);

  editor.commands.setContent(safeContent);
}, [editor, content]);
