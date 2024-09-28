function fetchFormats() {
  const url = document.getElementById('url').value;
  const fetchDiv = document.querySelector('.fetch');
  const downloadDiv = document.querySelector('.download');
  const formatSelect = document.getElementById('format');
  const loadingBar = document.querySelector('.loading-bar');
  const progress = loadingBar.querySelector('.progress');

  if (!url) {
    alert('Please enter a URL');
    return;
  }

  // Show the loading bar for fetching formats
  loadingBar.classList.remove('hidden');
  progress.style.width = '0%';

  // Simulate the progress fill
  let fetchWidth = 0;
  const fetchInterval = setInterval(() => {
    if (fetchWidth < 90) {
      fetchWidth += 10;
      progress.style.width = `${fetchWidth}%`;
    }
  }, 200);

  fetch(`/formats?url=${encodeURIComponent(url)}`)
    .then(response => response.text())
    .then(data => {
      clearInterval(fetchInterval); // Stop the progress simulation
      progress.style.width = '100%'; // Fill the loading bar

      // Populate the format select options
      const defaultOption = formatSelect.querySelector('option[value=""]');
      formatSelect.innerHTML = '';
      if (defaultOption) {
        formatSelect.appendChild(defaultOption); // Re-add default option
      }

      downloadDiv.classList.add('hidden'); // Hide download section initially
      fetchDiv.classList.add('hidden'); // Hide fetch section
      loadingBar.classList.add('hidden'); // Hide the loading bar after fetching

      data.split('\n').forEach(line => {
        const [id, ext, resolution] = line.split(/\s+/);
        if (id && ext && ext.includes('mp4')) {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = `${resolution || 'Resolution'} (${ext})`;
          formatSelect.appendChild(option);
        }
      });

      if (formatSelect.options.length > 1) {
        downloadDiv.classList.remove('hidden');
      }
    })
    .catch(error => {
      clearInterval(fetchInterval); // Stop the progress simulation on error
      console.error('Error fetching formats:', error);
    });
}

document.getElementById('downloadForm').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent the default form submission

  const downloadLoadingBar = document.querySelector('.download-loading-bar');
  const downloadProgress = downloadLoadingBar.querySelector('.download-progress');

  // Show the download loading bar
  downloadLoadingBar.classList.remove('hidden');
  downloadProgress.style.width = '0%';

  // Variable to control the progress
  let downloadWidth = 0;
  let downloadInterval;

  // Function to simulate the download progress bar filling
  const simulateDownloadProgress = () => {
    downloadInterval = setInterval(() => {
      if (downloadWidth < 95) {  // Simulate up to 95% to leave room for final fill
        downloadWidth += 1;
        downloadProgress.style.width = `${downloadWidth}%`;
      } else {
        clearInterval(downloadInterval);
      }
    }, 100);
  };

  simulateDownloadProgress();

  // Proceed with the form submission
  fetch(this.action + '?' + new URLSearchParams(new FormData(this)).toString())
    .then(response => response.blob())  // Assuming the file is returned as a blob
    .then(blob => {
      clearInterval(downloadInterval);
      downloadProgress.style.width = '100%'; // Ensure the bar is fully filled

      // Create a link element to download the file
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'video.mp4';  // You can change the filename if needed
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Hide the download loading bar after the download
      downloadLoadingBar.classList.add('hidden');
    })
    .catch(error => {
      clearInterval(downloadInterval);
      downloadLoadingBar.classList.add('hidden');
      console.error('Error during download:', error);
    });
});
