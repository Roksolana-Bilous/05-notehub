import { useState, useEffect } from "react";
import css from "./App.module.css";
import Pagination from "../Pagination/Pagination";
import SearchBox from "../SearchBox/SearchBox";
import NoteList from "../NoteList/NoteList";
import Modal from "../Modal/Modal";
import NoteForm from "../NoteForm/NoteForm";
import { useDebounce } from "use-debounce";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotes, deleteNote } from "../../services/noteService";
import toast, { Toaster } from "react-hot-toast";
import type { Note } from "../../types/note";

export default function App() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage: number = 12;

  const openModal = (): void => setShowModal(true);
  const closeModal = (): void => setShowModal(false);

  const handleSearchChange = (value: string): void => {
    setSearch(value);
    setCurrentPage(1);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notes", debouncedSearch, currentPage, itemsPerPage],
    queryFn: () => {
      const finalSearch = debouncedSearch.trim() === "" ? " " : debouncedSearch;
      return fetchNotes({ search: finalSearch, page: currentPage, perPage: itemsPerPage });
    },
    placeholderData: keepPreviousData,
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
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  const notesToDisplay: Note[] = data?.notes ?? [];
  const totalPages: number = data?.totalPages ?? 0;

  return (
    <div className={css.app}>
      <header className={css.toolbar}>
        <SearchBox value={search} onSearch={handleSearchChange} />

        {totalPages > 1 && (
          <Pagination
            pageCount={totalPages}
            currentPage={currentPage - 1}
            onPageChange={({ selected }: { selected: number }) => setCurrentPage(selected + 1)}
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
        <NoteList
          notes={notesToDisplay}
          deleteNote={(id: number) => deleteMutation.mutate(id)}
        />
      )}
      {showModal && (
        <Modal closeWindow={closeModal}>
          <NoteForm onClose={closeModal} />
        </Modal>
      )}

      <Toaster />
    </div>
  );
}

