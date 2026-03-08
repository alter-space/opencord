import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center pt-8">
      <Icon icon={Loading03Icon} className="animate-spin" />
    </div>
  );
}
