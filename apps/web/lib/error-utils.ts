export function isSubscriptionError(error: unknown): boolean {
  if (error && typeof error === "object" && "data" in error) {
    const errorData = error.data as { code?: string; message?: string };
    return (
      errorData?.code === "BAD_REQUEST" &&
      errorData?.message === "Subscription not active"
    );
  }
  return false;
}
