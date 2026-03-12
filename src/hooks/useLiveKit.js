import { useCallback, useState } from "react";
import {
  Track,
  createLocalVideoTrack,
  createLocalScreenTracks,
} from "livekit-client";
import {
  useRoomContext,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";

/**
 * Thin hook that sits INSIDE a <LiveKitRoom> and exposes:
 *   • toggleCamera / toggleScreenShare (mutually exclusive)
 *   • isCameraOn / isScreenOn state
 *   • hasActiveTracks — whether anyone is publishing video
 *   • participantMediaMap — identity→{hasCam, hasScreen} for sidebar indicators
 */
export default function useLiveKit() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);
  const localTrackRef = { current: null };

  // All video tracks across room (for indicator / grid visibility)
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  const hasActiveTracks = tracks.length > 0;

  // Build a map of participant identity → media status for sidebar indicators
  const participantMediaMap = {};
  tracks.forEach((trackRef) => {
    const identity = trackRef.participant?.identity;
    if (!identity) return;
    if (!participantMediaMap[identity]) {
      participantMediaMap[identity] = {
        hasCam: false,
        hasScreen: false,
        identity,
        name: trackRef.participant?.name || identity,
      };
    }
    if (trackRef.source === Track.Source.Camera) {
      participantMediaMap[identity].hasCam = true;
    }
    if (trackRef.source === Track.Source.ScreenShare) {
      participantMediaMap[identity].hasScreen = true;
    }
  });

  // ── Unpublish current local track ──
  const unpublishLocal = useCallback(async () => {
    if (!room || !localParticipant) return;
    const pubs = localParticipant.trackPublications;
    for (const [, pub] of pubs) {
      if (pub.track && pub.track.kind === Track.Kind.Video) {
        try {
          localParticipant.unpublishTrack(pub.track);
          pub.track.stop();
        } catch {
          // already stopped
        }
      }
    }
  }, [room, localParticipant]);

  // ── Toggle camera ──
  const toggleCamera = useCallback(async () => {
    if (!room || !localParticipant) return;

    if (isCameraOn) {
      await unpublishLocal();
      setIsCameraOn(false);
      return;
    }

    if (isScreenOn) {
      await unpublishLocal();
      setIsScreenOn(false);
    }

    try {
      const track = await createLocalVideoTrack({
        resolution: { width: 1280, height: 720 },
      });
      await localParticipant.publishTrack(track);
      setIsCameraOn(true);
    } catch (err) {
      console.error("[LiveKit] Camera publish failed:", err);
    }
  }, [isCameraOn, isScreenOn, unpublishLocal, room, localParticipant]);

  // ── Toggle screen share ──
  const toggleScreenShare = useCallback(async () => {
    if (!room || !localParticipant) return;

    if (isScreenOn) {
      await unpublishLocal();
      setIsScreenOn(false);
      return;
    }

    if (isCameraOn) {
      await unpublishLocal();
      setIsCameraOn(false);
    }

    try {
      const tracks = await createLocalScreenTracks({ audio: false });
      for (const t of tracks) {
        await localParticipant.publishTrack(t);
      }
      setIsScreenOn(true);

      // Handle browser "stop sharing" button
      const videoTrack = tracks.find((t) => t.kind === Track.Kind.Video);
      if (videoTrack?.mediaStreamTrack) {
        videoTrack.mediaStreamTrack.addEventListener("ended", async () => {
          await unpublishLocal();
          setIsScreenOn(false);
        });
      }
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        console.error("[LiveKit] Screen share failed:", err);
      }
    }
  }, [isScreenOn, isCameraOn, unpublishLocal, room, localParticipant]);

  return {
    isCameraOn,
    isScreenOn,
    hasActiveTracks,
    trackCount: tracks.length,
    participantMediaMap,
    toggleCamera,
    toggleScreenShare,
  };
}
