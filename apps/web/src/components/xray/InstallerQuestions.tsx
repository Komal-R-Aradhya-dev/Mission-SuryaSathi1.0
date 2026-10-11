export function InstallerQuestions({ questions }: { questions: string[] }) {
  const unique = [...new Set(questions.map((question) => question.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return <p className="text-sm text-ivory-dim">No installer questions were returned.</p>;
  }
  return (
    <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-ivory">
      {unique.map((question) => (
        <li key={question}>{question}</li>
      ))}
    </ol>
  );
}
