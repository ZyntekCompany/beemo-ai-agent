import { api } from "@workspace/backend/_generated/api";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type PhoneNumbers = typeof api.private.vapi.getPhoneNumbers._returnType;
type Assistants = typeof api.private.vapi.getAssitants._returnType;

export const useVapiAssitants = (): {
  data: Assistants,
  isLoading: boolean,
  error: Error | null,
} => {
  const [data, setData] = useState<Assistants>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getAssitants = useAction(api.private.vapi.getAssitants);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getAssitants();
        if (cancelled) return
        setData(result);
        setError(null);
      } catch (error) {
        if (cancelled) return
        setError(error as Error);
        toast.error("Failed to fetch assitants");
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    }
  }, [])

  return { data, isLoading, error }
}

export const useVapiPhoneNumbers = (): {
  data: PhoneNumbers,
  isLoading: boolean,
  error: Error | null,
} => {
  const [data, setData] = useState<PhoneNumbers>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getPhoneNumbers = useAction(api.private.vapi.getPhoneNumbers);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getPhoneNumbers();
        if (cancelled) return
        setData(result);
        setError(null);
      } catch (error) {
        if (cancelled) return
        setError(error as Error);
        toast.error("Failed to fetch phone numbers");
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    }
  }, [])

  return { data, isLoading, error }
}