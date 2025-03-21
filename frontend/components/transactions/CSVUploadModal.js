import { ButtonStyles as buttonStyles, FormStyles as formStyles, ModalStyles as modalStyles } from '../../styles/modules';
import { useCallback, useRef, useState } from 'react';

import Modal from '../common/Modal';
import { useDropzone } from 'react-dropzone';

const CSVUploadModal = ({ isOpen, onClose, onUpload, selectedAccountId }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    date: null,
    description: null,
    amount: null,
    category: null,
    merchant: null,
    has_header: true
  });
  const [step, setStep] = useState(1); // 1: File selection, 2: Column mapping
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Reset state when modal is closed
  const handleClose = () => {
    setFile(null);
    setCsvData([]);
    setColumnMapping({
      date: null,
      description: null,
      amount: null,
      category: null,
      merchant: null,
      has_header: true
    });
    setStep(1);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  // Handle file drop
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) {
      setError('Please select a valid CSV file.');
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file.');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Parse CSV file to preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));

        // Remove empty rows
        const filteredRows = rows.filter(row => row.some(cell => cell.length > 0));

        if (filteredRows.length === 0) {
          setError('The CSV file is empty.');
          return;
        }

        setCsvData(filteredRows);

        // Auto-detect column mapping
        const headerRow = filteredRows[0].map(header => header.toLowerCase());
        const mapping = { ...columnMapping, has_header: true };

        // Try to auto-detect columns based on common header names
        headerRow.forEach((header, index) => {
          if (/date|time/i.test(header)) {
            mapping.date = index;
          } else if (/desc|memo|note|narration/i.test(header)) {
            mapping.description = index;
          } else if (/amount|sum|total|value/i.test(header)) {
            mapping.amount = index;
          } else if (/category|cat|type|account/i.test(header)) {
            mapping.category = index;
          } else if (/merchant|vendor|payee|shop|store/i.test(header)) {
            mapping.merchant = index;
          }
        });

        setColumnMapping(mapping);
        setStep(2);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setError('Error parsing CSV file. Please check the file format.');
      }
    };
    reader.readAsText(selectedFile);
  }, [columnMapping]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  // Handle column mapping change
  const handleMappingChange = (field, value) => {
    setColumnMapping({
      ...columnMapping,
      [field]: value === '' ? null : parseInt(value, 10)
    });
  };

  // Handle has_header toggle
  const handleHasHeaderChange = (e) => {
    setColumnMapping({
      ...columnMapping,
      has_header: e.target.checked
    });
  };

  // Handle upload
  const handleUpload = async () => {
    // Validate mapping
    if (columnMapping.date === null || columnMapping.amount === null) {
      setError('Date and Amount columns are required.');
      return;
    }

    if (!selectedAccountId) {
      setError('Please select an account first.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64 for sending to the server
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = async () => {
        const fileContent = reader.result;

        // Call the onUpload callback with the file content and column mapping
        await onUpload(fileContent, columnMapping, selectedAccountId);

        // Close the modal after successful upload
        handleClose();
      };
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setError('Error uploading CSV file. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Transactions from CSV"
      contentClassName={modalStyles.wideModalContent}
    >
      {step === 1 && (
        <div className={modalStyles.modalBody}>
          <div
            {...getRootProps()}
            className={`${formStyles.dropzone} ${isDragActive ? formStyles.dropzoneActive : ''}`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <div className={formStyles.dropzoneIcon}>
              📄
            </div>
            {isDragActive ? (
              <p className={formStyles.dropzoneText}>Drop the CSV file here...</p>
            ) : (
              <>
                <p className={formStyles.dropzoneText}>Drag and drop a CSV file here</p>
                <p className={formStyles.dropzoneHint}>
                  The file should contain columns for date, amount, and optionally description and category.
                </p>
                <button
                  type="button"
                  className={formStyles.browseButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current.click();
                  }}
                >
                  Browse Files
                </button>
              </>
            )}
          </div>

          {file && (
            <div className={formStyles.fileInfo}>
              <p>Selected file: {file.name} ({Math.round(file.size / 1024)} KB)</p>
            </div>
          )}

          {error && <p className={formStyles.errorText}>{error}</p>}

          <div className={modalStyles.modalFooter}>
            <button
              className={buttonStyles.cancelButton}
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={modalStyles.modalBody}>
          <h3>Map CSV Columns</h3>
          <p>Please map the columns in your CSV file to the required fields:</p>

          <div className={formStyles.previewTable}>
            <table>
              <thead>
                <tr>
                  {csvData[0].map((header, index) => (
                    <th key={index}>Column {index + 1}{columnMapping.has_header ? `: ${header}` : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(columnMapping.has_header ? 1 : 0, 3).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={formStyles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={columnMapping.has_header}
                onChange={handleHasHeaderChange}
              />
              First row contains headers
            </label>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="date-column">Date Column (required):</label>
            <select
              id="date-column"
              value={columnMapping.date === null ? '' : columnMapping.date}
              onChange={(e) => handleMappingChange('date', e.target.value)}
              required
              className={formStyles.input}
            >
              <option value="">Select a column</option>
              {csvData[0].map((header, index) => (
                <option key={index} value={index}>
                  {columnMapping.has_header ? header : `Column ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="amount-column">Amount Column (required):</label>
            <select
              id="amount-column"
              value={columnMapping.amount === null ? '' : columnMapping.amount}
              onChange={(e) => handleMappingChange('amount', e.target.value)}
              required
              className={formStyles.input}
            >
              <option value="">Select a column</option>
              {csvData[0].map((header, index) => (
                <option key={index} value={index}>
                  {columnMapping.has_header ? header : `Column ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="description-column">Description Column (optional):</label>
            <select
              id="description-column"
              value={columnMapping.description === null ? '' : columnMapping.description}
              onChange={(e) => handleMappingChange('description', e.target.value)}
              className={formStyles.input}
            >
              <option value="">Select a column</option>
              {csvData[0].map((header, index) => (
                <option key={index} value={index}>
                  {columnMapping.has_header ? header : `Column ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="merchant-column">Merchant Column (optional):</label>
            <select
              id="merchant-column"
              value={columnMapping.merchant === null ? '' : columnMapping.merchant}
              onChange={(e) => handleMappingChange('merchant', e.target.value)}
              className={formStyles.input}
            >
              <option value="">Select a column</option>
              {csvData[0].map((header, index) => (
                <option key={index} value={index}>
                  {columnMapping.has_header ? header : `Column ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="category-column">Category Column (optional - leave blank to categorize later):</label>
            <select
              id="category-column"
              value={columnMapping.category === null ? '' : columnMapping.category}
              onChange={(e) => handleMappingChange('category', e.target.value)}
              className={formStyles.input}
            >
              <option value="">Leave uncategorized</option>
              {csvData[0].map((header, index) => (
                <option key={index} value={index}>
                  {columnMapping.has_header ? header : `Column ${index + 1}`}
                </option>
              ))}
            </select>
            <p className={formStyles.fieldHint}>
              Transactions will be uploaded without a category if none is selected, allowing you to categorize them later.
            </p>
          </div>

          {error && <p className={formStyles.errorText}>{error}</p>}

          <div className={formStyles.mappingFooter}>
            <div>
              <button
                className={formStyles.backButton}
                onClick={() => setStep(1)}
                disabled={isUploading}
              >
                Back
              </button>
              <button
                className={buttonStyles.cancelButton}
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancel
              </button>
            </div>
            <button
              className={formStyles.uploadButton}
              onClick={handleUpload}
              disabled={isUploading || columnMapping.date === null || columnMapping.amount === null}
            >
              {isUploading ? 'Uploading...' : 'Upload Transactions'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CSVUploadModal;
