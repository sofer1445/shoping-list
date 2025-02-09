
import { AuthForms } from "./AuthForms";

interface AuthProps {
  redirectTo?: string;
}

export const CustomAuth = ({ redirectTo }: AuthProps) => {
  return <AuthForms redirectTo={redirectTo} />;
};
