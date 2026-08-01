import type {
  DialogueRequest,
  DialogueResponse,
} from '../../src/shared/contracts';

export interface DialogueProvider {
  generate(request: DialogueRequest): Promise<DialogueResponse>;
}
