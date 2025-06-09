function PromptInput({ value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
        Contexte et Instructions
      </label>
      <textarea
        id="prompt"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
        placeholder="Décrivez le contexte de votre vidéo et les détails spécifiques que vous souhaitez inclure dans le guide d'instructions..."
      />
      <p className="text-xs text-gray-500">
        Ex: "Vidéo de montage d'un meuble IKEA. Je veux un guide détaillé avec des avertissements sur les pièces fragiles."
      </p>
    </div>
  );
}

export default PromptInput;
