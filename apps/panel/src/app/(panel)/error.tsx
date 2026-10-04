"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GraphqlErrorView } from "@/components/graphql-error-view";
import { GraphqlError, isDebugMode } from "@/providers/graphql/errors";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	const isDebug = isDebugMode() && error instanceof GraphqlError;

	return (
		<div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-6 text-center">
			{isDebug ? (
				<div className="w-full max-w-2xl text-left">
					<GraphqlErrorView errors={error.errors} />
				</div>
			) : (
				<>
					<h1 className="text-2xl font-semibold text-foreground">
						Algo salió mal
					</h1>
					<p className="max-w-md text-muted-foreground">
						Ocurrió un error inesperado. Por favor, inténtalo de
						nuevo.
					</p>
				</>
			)}

			<Button onClick={reset}>Reintentar</Button>
		</div>
	);
}
