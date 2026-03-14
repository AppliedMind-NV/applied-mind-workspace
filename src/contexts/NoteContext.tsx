import { createContext, useContext, useState, ReactNode } from "react";

interface NoteContextType {
  activeNoteTitle: string;
  activeNoteText: string;
  selectedText: string;
  setActiveNote: (title: string, text: string) => void;
  setSelectedText: (text: string) => void;
}

const NoteContext = createContext<NoteContextType>({
  activeNoteTitle: "",
  activeNoteText: "",
  selectedText: "",
  setActiveNote: () => {},
  setSelectedText: () => {},
});

export const useNoteContext = () => useContext(NoteContext);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [activeNoteTitle, setTitle] = useState("");
  const [activeNoteText, setText] = useState("");
  const [selectedText, setSelectedText] = useState("");

  const setActiveNote = (title: string, text: string) => {
    setTitle(title);
    setText(text);
  };

  return (
    <NoteContext.Provider value={{ activeNoteTitle, activeNoteText, selectedText, setActiveNote, setSelectedText }}>
      {children}
    </NoteContext.Provider>
  );
}
