import { useState, useEffect } from "react";
import css from "./App.module.css";
import Pagination from "../Pagination/Pagination";
import SearchBox from "../SearchBox/SearchBox";
import NoteList from "../NoteList/NoteList";
import Modal from "../Modal/Modal";
import NoteForm from "../NoteForm/NoteForm";
import { useDebounce } from "use-debounce";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotes, createNote, deleteNote } from "../../services/noteService";
import toast, { Toaster } from "react-hot-toast";
import type { Note } from "../../types/note";

export default function App() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const openModal = () => setShowModal(true);
  const closeModal = () => {
    setShowModal(false);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notes", debouncedSearch, currentPage, itemsPerPage],
    queryFn: () => {
      const finalSearch = debouncedSearch === "" ? " " : debouncedSearch;
      return fetchNotes({ search: finalSearch, page: currentPage, perPage: itemsPerPage });
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (newNoteData: Note) => createNote(newNoteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("The note was created successfully!");
      closeModal();
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
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  const notesToDisplay = data?.notes ?? [];
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className={css.app}>
      <header className={css.toolbar}>
        <SearchBox value={search} onSearch={handleSearchChange} />

        {totalPages > 1 && (
          <Pagination
            pageCount={totalPages}
            currentPage={currentPage - 1}
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

      {showModal && (
        <Modal closeWindow={closeModal}>
            <NoteForm
              cancelButton={closeModal}
              onSubmit={(values) => createMutation.mutate({ ...values, id: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })}
            />
          </Modal>
      )}

      <Toaster />
    </div>
  );
}
