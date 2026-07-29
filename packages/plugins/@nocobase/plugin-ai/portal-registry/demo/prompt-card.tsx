import { PromptOutput } from "@/components/demo/prompt-output";

export function PromptCard({
  title,
  description,
  prompt,
}: {
  title: string;
  description: string;
  prompt: string;
}) {
  return (
    <PromptOutput
      title={title}
      description={description}
      prompt={prompt}
      promptClassName="max-h-[620px]"
    />
  );
}
