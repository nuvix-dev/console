import {
  CardBox,
  CardBoxBody,
  CardBoxDesc,
  CardBoxItem,
  CardBoxTitle,
} from "@/components/others/card";
import { useToast, Button } from "@nuvix/ui/components";
import { useProjectStore } from "@/lib/store";
import { Models } from "@nuvix/console";
import { sdkForConsole } from "@/lib/sdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@nuvix/sui/components/dialog";
import { Alert, AlertDescription } from "@nuvix/sui/components/alert";
import React from "react";
import { ClipboardInput, ClipboardRoot } from "@nuvix/cui/clipboard";
import { Info } from "lucide-react";

export const SignatureKey = ({ webhook }: { webhook: Models.Webhook }) => {
  const project = useProjectStore.use.project?.();
  const { addToast } = useToast();
  const [updated, setUpdated] = React.useState<Models.Webhook | null>(null);
  const [rotating, setRotating] = React.useState(false);

  async function rotateSignatureKey() {
    if (!project) return;
    setRotating(true);
    await sdkForConsole.projects
      .updateWebhookSignature(project.$id, webhook.$id)
      .then((res) => {
        setUpdated(res);
      })
      .catch((err) => {
        addToast({
          message: err.message,
          variant: "danger",
        });
      })
      .finally(() => {
        setRotating(false);
      });
  }

  return (
    <>
      <CardBox
        actions={
          <>
            <Button
              size={"s"}
              variant={"secondary"}
              onClick={rotateSignatureKey}
              loading={rotating}
            >
              Rotate Signature Key
            </Button>
          </>
        }
      >
        <CardBoxBody>
          <CardBoxItem gap={"4"}>
            <CardBoxTitle>Webhook Signature key</CardBoxTitle>
            <CardBoxDesc>
              Signature key is used to verify the authenticity of the webhook payload.
            </CardBoxDesc>
          </CardBoxItem>
          <CardBoxItem>
            <Alert variant={"info"}>
              <Info />
              <AlertDescription>
                You can only view the signature key once, after that it will be hidden for security
                reasons. If you lose it, you will need to rotate the key to generate a new one.
              </AlertDescription>
            </Alert>
          </CardBoxItem>
        </CardBoxBody>
      </CardBox>

      <Dialog
        open={!!updated}
        onOpenChange={(o) => {
          if (!o) {
            setUpdated(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signature Key Rotated</DialogTitle>
            <DialogDescription>
              Your webhook signature key has been rotated. Please copy and save the new signature
              key below, as it will not be shown again for security reasons.
            </DialogDescription>
          </DialogHeader>
          <ClipboardRoot value={updated?.signatureKey}>
            <ClipboardInput />
          </ClipboardRoot>
        </DialogContent>
      </Dialog>
    </>
  );
};
