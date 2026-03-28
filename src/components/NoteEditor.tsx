import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Undo,
  Redo,
} from "lucide-react";

const lowlight = createLowlight(common);

interface NoteEditorProps {
  content: any;
  onUpdate: (json: any) => void;
  onSelectionChange?: (text: string) => void;
}

export default function NoteEditor({ content, onUpdate, onSelectionChange }: NoteEditorProps) {
  console.log("[NoteEditor] mount/render with content:", JSON.stringify(content)?.slice(0, 300));
  const isExternalUpdate = useRef(false);

  const contentRef = useRef(content);
  contentRef.current = content;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: "Start typing your notes… Use the toolbar for formatting.",
      }),
    ],
    content: content || { type: "doc", content: [] },
    onCreate: ({ editor }) => {
      const currentContent = contentRef.current;
      if (currentContent && currentContent.type === "doc") {
        const editorJSON = JSON.stringify(editor.getJSON());
        const expectedJSON = JSON.stringify(currentContent);
        if (editorJSON !== expectedJSON) {
          console.log("[NoteEditor] onCreate: content mismatch, forcing setContent");
          isExternalUpdate.current = true;
          editor.commands.setContent(currentContent);
          isExternalUpdate.current = false;
        }
      }
    },
    onUpdate: ({ editor }) => {
      if (!isExternalUpdate.current) {
        onUpdate(editor.getJSON());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = from !== to ? editor.state.doc.textBetween(from, to, " ") : "";
      onSelectionChange?.(text);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-0 py-2",
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const safeContent = content || { type: "doc", content: [] };
    const currentJSON = JSON.stringify(editor.getJSON());
    const newJSON = JSON.stringify(safeContent);
    console.log("[NoteEditor] useEffect content sync - match:", currentJSON === newJSON, "content:", newJSON?.slice(0, 200));
    if (currentJSON !== newJSON) {
      console.log("[NoteEditor] useEffect: applying setContent");
      isExternalUpdate.current = true;
      editor.commands.setContent(safeContent);
      isExternalUpdate.current = false;
    }
  }, [content, editor]);

  if (!editor) return null;

  const ToolbarButton = ({
    onAction,
    active,
    children,
    title,
  }: {
    onAction: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onAction();
      }}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 flex-wrap border-b pb-2 mb-3">
        <ToolbarButton
          onAction={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Italic size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          onAction={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          onAction={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          onAction={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <Code size={14} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
        >
          <Minus size={14} />
        </ToolbarButton>

        <div className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          onAction={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton
          onAction={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo size={14} />
        </ToolbarButton>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
