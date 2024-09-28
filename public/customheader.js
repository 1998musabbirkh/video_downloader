class CustomHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `<header>
            <div class="logo">
                <h4>Digital Video Downloader</h4>
            </div>

            <nav class="desktop-nav">
                <ul>
                    <li><a href="/">YouTube Video Downloader</a></li>
                    <li><a href="/fb.html">Facebook Video Downloader</a></li>
                    <li><a href="/tiktok.html">TikTok Video Downloader</a></li>
                </ul>
            </nav>
        </header>`;
    }
}

customElements.define("custom-header", CustomHeader);
