import { CollectionListScreen } from "@/components/admin/CollectionTable";
import { getCollection } from "@/components/admin/collection-config";
import { listRows } from "@/components/admin/collection-data";

export default async function Page() {
  const config = getCollection("team");
  const rows = await listRows("team");
  return (
    <CollectionListScreen
      config={{ ...config, label: "บุคลากร / Personnel", singular: "บุคลากร / Add person" }}
      rows={rows}
    />
  );
}
