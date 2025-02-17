
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
          <TableRow>
            <TableCell><a href="model_doc/altclip">AltCLIP</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">❌</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/aria">Aria</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">❌</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/aria_text">AriaText</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">❌</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/audio-spectrogram-transformer">Audio Spectrogram Transformer</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">❌</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/autoformer">Autoformer</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">❌</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/bamba">Bamba</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">❌</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/bark">Bark</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">❌</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/bart">BART</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/barthez">BARThez</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/bartpho">BARTpho</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/beit">BEiT</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">❌</TableCell>
            <TableCell className="text-center">✅</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><a href="model_doc/bert">BERT</a></TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
            <TableCell className="text-center">✅</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ScrollArea>
  )
}
