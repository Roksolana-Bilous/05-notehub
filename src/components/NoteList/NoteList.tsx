import css from "./NoteList.module.css";
import type { Note } from "../../types/note";
import { deleteNote } from "../../services/noteService";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface NoteListProps {
  notes: Note[];
  deleteNote: (id: number) => void;
}

export default function NoteList({ notes }: NoteListProps) {
  const queryClient = useQueryClient();

  const handleDelete = async (id: number) => {
    try {
      const confirm = window.confirm("Are you sure you want to delete this note?");
      if (!confirm) return;

      await deleteNote(id);
      toast.success("Note successfully deleted!");

      // Інвалідуємо кеш після успішного видалення
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    } catch (error) {
  console.error("Delete error:", error);
  toast.error("An error occurred while deleting the note.");
    }
  };

  return (
    <ul className={css.list}>
      {notes.map((note) => (
        <li key={note.id} className={css.listItem}>
          <h2 className={css.title}>{note.title}</h2>
          <p className={css.content}>{note.content}</p>
          <div className={css.footer}>
            <span className={css.tag}>{note.tag}</span>
            <button className={css.button} onClick={() => handleDelete(note.id)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
