import Modal from "../Modal/Modal";
import EditStatsForm from "./EditStatsForm";

interface EditStatsModalProps {
  onClose: () => void;
}

function EditStatsModal({ onClose }: EditStatsModalProps) {
  return (
    <Modal title="Your stats" onClose={onClose}>
      <EditStatsForm />
    </Modal>
  );
}

export default EditStatsModal;
