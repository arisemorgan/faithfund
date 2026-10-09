import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-card p-6 rounded-2xl shadow-2xl w-full max-w-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-muted-foreground hover:text-primary transition" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          {children}
        </div>
      </div>

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.25s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-scaleIn {
          animation: scaleIn 0.25s ease forwards;
        }
        @keyframes scaleIn {
          from { transform: scale(.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
