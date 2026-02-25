import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useThemeStore } from "@/stores";
import { userService, authService } from "@/services";
import {
  FIELD_LABELS,
  COUNTRY_LABELS,
  SEX_LABELS,
  ROUTES,
} from "@/utils/constants";
import ActivityHeatmap from "@/components/ui/ActivityHeatmap";
import EditProfileDrawer from "@/components/ui/EditProfileDrawer";

/**
 * Default profile background.
 */
const DEFAULT_BG =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80";

/**
 * Social media icon components.
 */
function DiscordIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

function TwitterIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * ProfilePage — shows user profile.
 * /user/me → own profile (fetches from /me)
 * /user/:id → other user profile (fetches from /users/:id)
 */
function ProfilePage() {
  const { id } = useParams();
  const { user: authUser } = useAuthStore();
  const { theme } = useThemeStore();

  const isOwnProfile = id === "me" || id === authUser?.id;

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit drawer state
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Heatmap state
  const [heatmapData, setHeatmapData] = useState(null);
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear());
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);
      try {
        let data;
        if (isOwnProfile) {
          data = await authService.getMe();
        } else {
          data = await userService.getProfile(id);
        }
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || "فشل تحميل الملف الشخصي.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [id, isOwnProfile]);

  // Fetch heatmap
  useEffect(() => {
    async function fetchHeatmap() {
      if (!profile?.id) return;
      setHeatmapLoading(true);
      try {
        const result = await userService.getHeatmap(profile.id, heatmapYear);
        setHeatmapData(result.data);
      } catch {
        setHeatmapData(null);
      } finally {
        setHeatmapLoading(false);
      }
    }
    fetchHeatmap();
  }, [profile?.id, heatmapYear]);

  // Derived display values
  const fieldLabel = profile?.field
    ? FIELD_LABELS[profile.field] || profile.field
    : null;
  const countryLabel = profile?.country
    ? COUNTRY_LABELS[profile.country] || profile.country
    : null;
  const genderLabel = profile?.gender
    ? SEX_LABELS[profile.gender] || profile.gender
    : null;

  const bgUrl = profile?.profileBackgroundUrl || DEFAULT_BG;
  const focusHours = profile
    ? Math.round((profile.totalFocusMinutes || 0) / 60)
    : 0;

  // ── Loading state ── //
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto animate-pulse">
        <div className="h-56 bg-surface-muted rounded-2xl mb-6" />
        <div className="max-w-4xl mx-auto px-6 space-y-4">
          <div className="flex gap-6">
            <div className="w-32 h-32 rounded-full bg-surface-muted -mt-16" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-8 bg-surface-muted rounded w-48" />
              <div className="h-4 bg-surface-muted rounded w-32" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ── //
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-error">{error}</p>
          <Link
            to={ROUTES.DISCOVER}
            className="text-brand-600 hover:underline text-sm font-medium"
          >
            العودة إلى اكتشف
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ══════ Background Banner ══════ */}
      <div className="relative h-52 md:h-64 rounded-2xl overflow-hidden">
        <img
          src={bgUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/30 to-transparent" />
      </div>

      {/* ══════ Profile Content ══════ */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-16 relative z-10 pb-8 space-y-8">
        {/* ── Header Row ── */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.nickName}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-surface shadow-elevated"
              />
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-brand-100 dark:bg-brand-900/30 border-4 border-surface shadow-elevated flex items-center justify-center">
                <span className="text-4xl font-bold text-brand-600">
                  {(profile.nickName || profile.username || "م").charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 text-center md:text-start space-y-2">
            <h1 className="font-display text-3xl font-bold text-text-primary">
              {profile.nickName || profile.username}
            </h1>
            <p className="text-brand-600 font-medium text-sm">
              @{profile.username}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              {fieldLabel && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-muted text-text-secondary text-xs border border-border">
                  {fieldLabel}
                </span>
              )}
              {countryLabel && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-muted text-text-secondary text-xs border border-border">
                  {countryLabel}
                </span>
              )}
              {genderLabel && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-muted text-text-secondary text-xs border border-border">
                  {genderLabel}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            {isOwnProfile && (
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                تعديل الملف الشخصي
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-muted hover:bg-surface-elevated text-text-secondary font-bold rounded-xl transition-colors border border-border text-sm cursor-pointer">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                />
              </svg>
              مشاركة
            </button>
          </div>
        </div>

        {/* ── Quote ── */}
        {profile.quote && (
          <div className="relative pe-5">
            <div className="absolute end-0 top-0 bottom-0 w-1 bg-brand-600 rounded-full" />
            <p
              dir="auto"
              className="text-text-secondary leading-relaxed italic text-base"
            >
              {profile.quote}
            </p>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard value={focusHours} label="ساعات التركيز" />
          <StatCard value={profile.sessionsCount || 0} label="الجلسات" />
          <StatCard
            value={profile.currentStreak || 0}
            label="السلسلة الحالية 🔥"
          />
          <StatCard value={profile.longestStreak || 0} label="أطول سلسلة" />
        </div>

        {/* ── Two Column: Social + Interests ── */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Social links */}
          {(profile.discordUsername || profile.twitterUrl) && (
            <div className="bg-surface-elevated border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">
                التواصل الاجتماعي
              </h3>
              <div className="flex gap-3">
                {profile.discordUsername && (
                  <span
                    className="flex items-center gap-2 px-3 py-2 bg-[#5865F2]/10 text-[#5865F2] rounded-xl text-sm font-medium border border-[#5865F2]/20"
                    title={profile.discordUsername}
                  >
                    <DiscordIcon className="w-4 h-4" />
                    {profile.discordUsername}
                  </span>
                )}
                {profile.twitterUrl && (
                  <a
                    href={profile.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/5 text-text-primary rounded-xl text-sm font-medium border border-border hover:border-brand-500 transition-colors"
                  >
                    <TwitterIcon className="w-4 h-4" />X / Twitter
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="bg-surface-elevated border border-border rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">
                الاهتمامات
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-brand-500/10 text-brand-600 rounded-lg text-sm font-medium border border-brand-500/20"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Activity Heatmap ── */}
        <div className="bg-surface-elevated border border-border rounded-2xl p-5">
          <ActivityHeatmap
            data={heatmapData}
            year={heatmapYear}
            isLoading={heatmapLoading}
            isDark={theme === "dark"}
            onYearChange={setHeatmapYear}
          />
        </div>

        {/* ── Member Since ── */}
        <p className="text-center text-xs text-text-muted">
          عضو منذ{" "}
          {new Date(profile.createdAt).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* ══════ Edit Profile Drawer ══════ */}
      {isOwnProfile && (
        <EditProfileDrawer
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          profile={profile}
          onUpdated={(refreshed) => setProfile(refreshed)}
        />
      )}
    </div>
  );
}

/**
 * Stat card — small metric display.
 */
function StatCard({ value, label }) {
  return (
    <div className="bg-surface-elevated border border-border p-5 rounded-2xl flex flex-col items-center hover:shadow-card-hover transition-shadow">
      <span className="text-2xl font-bold text-text-primary mb-1">{value}</span>
      <span className="text-[11px] uppercase tracking-wider font-bold text-brand-600">
        {label}
      </span>
    </div>
  );
}

export default ProfilePage;
