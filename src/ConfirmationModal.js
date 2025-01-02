import { faCheck, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Button, Form, Modal } from 'react-bootstrap';

const ConfirmationModal = ({ show, message, close, confirm, error }) => {
  const submitForm = (e) => {
    e.preventDefault();
    confirm(close);
  };

  return (
    <Modal show={show} onHide={() => close()}>
      <Form className="text-left" onSubmit={submitForm}>
        <Modal.Header closeButton>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>{message}</h5>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={() => close()}>
            <FontAwesomeIcon icon={faChevronLeft} /> Back
          </Button>
          <Button type="submit" variant="primary">
            <FontAwesomeIcon icon={faCheck} /> Confirm
          </Button>
          {}
        </Modal.Footer>
        {error && <Alert variant="error">{error.message}</Alert>}
      </Form>
    </Modal>
  );
};

export default ConfirmationModal;
