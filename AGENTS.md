<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep offline business data in one versioned workspace model with clients, recurring contracts, and monthly service instances, because migration and cross-entity totals must remain atomic.
- The app must stay 100% offline (localStorage only, no server functions or backend) because it is packaged as a static WebView build with Capacitor (capacitor.config.ts → webDir ".output/public"); don't add anything that requires a runtime server.
