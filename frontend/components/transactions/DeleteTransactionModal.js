import { ButtonStyles, ModalStyles } from '../../styles/modules';

import Modal from '../common/Modal';

const DeleteTransactionModal = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Deletion"
    >
      <div className={ModalStyles.confirmDialog}>
        <p>Are you sure you want to delete this transaction?</p>
        <p>This action cannot be undone.</p>

        <div className={ModalStyles.confirmActions}>
          <button
            className={ButtonStyles.deleteButton}
            onClick={onConfirm}
          >
            Delete
          </button>
          <button
            className={ButtonStyles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteTransactionModal;
