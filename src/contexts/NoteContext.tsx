import { createContext, useContext, useState, ReactNode } from "react";

interface NoteContextType {
  activeNoteTitle: string;
  activeNoteText: string;
  setActiveNote: (title: string, text: string) => void;
}

const NoteContext = createContext<NoteContextType>({
  activeNoteTitle: "",
  activeNoteText: "",
  setActiveNote: () => {},
});

export const useNoteContext = () => useContext(NoteContext);

export function NoteProvider({ children }: { children: ReactNode }) {
  const [activeNoteTitle, setTitle] = useState("");
  const [activeNoteText, setText] = useState("");

  const setActiveNote = (title: string, text: string) => {
    setTitle(title);
    setText(text);
  };

  return (
    <NoteContext.Provider value={{ activeNoteTitle, activeNoteText, setActiveNote }}>
      {children}
    </NoteContext.Provider>
  );
}
