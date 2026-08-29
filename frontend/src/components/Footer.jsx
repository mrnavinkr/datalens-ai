import { Github, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-ink-700 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-mist-500 font-mono">
          Developed by <span className="text-mist-300">Er. Navin Kumar</span>
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/navinhere"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-ink-600 text-mist-300 hover:border-scan-500 hover:text-scan-400 transition-colors text-sm"
          >
            <Linkedin size={15} /> LinkedIn
          </a>
          <a
            href="https://github.com/mrnavinkr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-ink-600 text-mist-300 hover:border-scan-500 hover:text-scan-400 transition-colors text-sm"
          >
            <Github size={15} /> GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
