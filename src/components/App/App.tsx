import { useState, useEffect } from "react";
import css from "./App.module.css";
import Pagination from "../Pagination/Pagination";
import SearchBox from "../SearchBox/SearchBox";
import NoteList from "../NoteList/NoteList";
import Modal from "../Modal/Modal";
import NoteForm from "../NoteForm/NoteForm";
import { useDebouncedCallback } from "use-debounce";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotes, createNote, deleteNote } from "../../services/noteService";
import toast, { Toaster } from "react-hot-toast";
import type { NoteTag } from "../../types/note";

export default function App() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const updateSearchQuery = useDebouncedCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, 300);

  const handleSearchChange = (value: string) => {
    setInputValue(value);
    updateSearchQuery(value);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notes", currentPage, searchQuery],
    queryFn: () => fetchNotes({ page: currentPage, search: searchQuery }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (newNoteData: NoteTag) => createNote(newNoteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      closeModal();
      toast.success("The note was created successfully!");
      setCurrentPage(1);
    },
    onError: () => {
      toast.error("An error occurred while creating the note.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: number) => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note successfully deleted!");
    },
    onError: () => {
      toast.error("An error occurred while deleting the note.");
    },
  });

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const notesToDisplay = data?.notes ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className={css.app}>
      <header className={css.toolbar}>
        <SearchBox value={inputValue} onSearch={handleSearchChange} />
        {totalPages > 1 && (
  <Pagination
    pageCount={totalPages}
    currentPage={currentPage}
    onPageChange={({ selected }) => setCurrentPage(selected + 1)}
  />
)}

        <button className={css.button} onClick={openModal}>
          Create note +
        </button>
      </header>

      {isLoading && <p className={css.loading}>Loading notes...</p>}
      {isError && <p className={css.error}>Error loading notes!</p>}

      {!isLoading && !isError && notesToDisplay.length === 0 && (
        <p>No notes found. Create your first note!</p>
      )}

      {notesToDisplay.length > 0 && (
        <NoteList notes={notesToDisplay} deleteNote={(id) => deleteMutation.mutate(id)} />
      )}

      {isModalOpen && (
        <Modal closeWindow={closeModal}>
            <NoteForm
              cancelButton={closeModal}
              onSubmit={(values) => createMutation.mutate(values)}
            />
          </Modal>
      )}

      <Toaster />
    </div>
  );
}
