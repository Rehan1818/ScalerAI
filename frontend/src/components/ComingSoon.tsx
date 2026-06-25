interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div>
      <div className="aws-page-header">
        <h1 className="aws-page-title">{title}</h1>
      </div>
      <div className="aws-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f3f3] text-2xl">
          🚧
        </div>
        <h2 className="mb-2 text-lg font-medium text-[#16191f]">Coming Soon</h2>
        <p className="mx-auto max-w-md text-sm text-[#545b64]">
          {description ||
            "This feature is part of the Route 53 experience and will be available in a future release."}
        </p>
      </div>
    </div>
  );
}
