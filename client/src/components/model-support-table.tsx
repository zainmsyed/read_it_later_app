
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { ScrollArea } from "./ui/scroll-area"

export function ModelSupportTable() {
  return (
    <ScrollArea className="h-[500px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead className="text-center">PyTorch</TableHead>
            <TableHead className="text-center">TensorFlow</TableHead>
            <TableHead className="text-center">Flax</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell><a href="model_doc/albert">ALBERT</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/align">ALIGN</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">❌</TableCell>
          </TableRow>
          {/* Add more rows as needed */}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
