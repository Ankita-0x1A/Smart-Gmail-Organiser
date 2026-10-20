import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import EmailList from "../components/emails/EmailList";
import EmailDetailPanel from "../components/emails/EmailDetailPanel";
import CategoryModal from "../components/modals/CategoryModal";
import ConnectGmailModal from "../components/modals/ConnectGmailModal";
import {
  getCategoriesApi,
  createCategoryApi,
  getCategoryEmailsApi,
} from "../api/categories";
import {
  getGmailAccountsApi,
  getAccountEmailsApi,
  syncGmailAccountApi,
  getEmailDetailApi,
  markEmailAsReadApi,
} from "../api/emails";
import {
  assignCategoriesApi,
  removeCategoryApi,
} from "../api/emailCategories";
import { classifyEmailAiApi } from "../api/ai";
import { useAuth } from "../context/AuthContext";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // Storage keys specific to the logged-in user
  const accountIdKey = user ? `gmail_account_id_${user.id}` : "gmail_account_id";
  const emailAddressKey = user ? `gmail_email_address_${user.id}` : "gmail_email_address";

  const [categories, setCategories] = useState([]);
  const [activeNav, setActiveNav] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "unread", "important"
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [classifyingAI, setClassifyingAI] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [accountId, setAccountId] = useState(null);
const [connectedEmail, setConnectedEmail] = useState(null);


useEffect(() => {
  async function loadGmailAccount() {
    try {
      const data = await getGmailAccountsApi();
      const accounts = data?.accounts || [];

      if (accounts.length > 0) {
        setAccountId(String(accounts[0].id));
        setConnectedEmail(accounts[0].email_address || "");
      } else {
        setAccountId(null);
        setConnectedEmail(null);
      }
    } catch (err) {
      console.error("Failed to load Gmail accounts:", err.message);
    }
  }

  loadGmailAccount();
}, []);

  // Email category assignments mapping: emailId -> array of category names & IDs
  const [emailCategoriesMap, setEmailCategoriesMap] = useState({});
  const [emailCategoryIdsMap, setEmailCategoryIdsMap] = useState({});
  const [aiReasonsMap, setAiReasonsMap] = useState({});

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch categories from backend on mount and populate initial category map
  useEffect(() => {
    async function loadCategories() {
      try {
        const fetchedCats = await getCategoriesApi();
        if (Array.isArray(fetchedCats)) {
          setCategories(fetchedCats);

          // Query category email mappings for each category to populate chips
          fetchedCats.forEach(async (cat) => {
            try {
              const res = await getCategoryEmailsApi({
                categoryId: cat.id,
                limit: 50,
                offset: 0,
              });
              if (res.emails && res.emails.length > 0) {
                setEmailCategoriesMap((prev) => {
                  const next = { ...prev };
                  res.emails.forEach((em) => {
                    const currentNames = next[em.id] || [];
                    if (!currentNames.includes(cat.name)) {
                      next[em.id] = [...currentNames, cat.name];
                    }
                  });
                  return next;
                });

                setEmailCategoryIdsMap((prev) => {
                  const next = { ...prev };
                  res.emails.forEach((em) => {
                    const currentIds = next[em.id] || [];
                    if (!currentIds.includes(Number(cat.id))) {
                      next[em.id] = [...currentIds, Number(cat.id)];
                    }
                  });
                  return next;
                });
              }
            } catch (err) {
              console.warn(`Could not preload category ${cat.name}:`, err.message);
            }
          });
        }
      } catch (err) {
        console.error("Failed to load categories:", err.message);
        showToast("Could not fetch categories from server", "error");
      }
    }
    loadCategories();
  }, []);

  // 2. Fetch emails whenever activeNav, accountId, searchQuery, or filter changes
  const fetchEmails = useCallback(async () => {
    setError(null);
    setLoadingEmails(true);

    try {
      const isUnreadFilter = filter === "unread";

      if (activeNav === "all") {
        // "All Emails" view requires an active accountId
        if (!accountId) {
          setEmails([]);
          setLoadingEmails(false);
          return;
        }

        const data = await getAccountEmailsApi({
          accountId,
          limit: 50,
          offset: 0,
          search: searchQuery,
          unread: isUnreadFilter,
        });

        const fetchedEmails = data.emails || [];
        setEmails(fetchedEmails);

        if (selectedEmail) {
          const match = fetchedEmails.find((e) => e.id === selectedEmail.id);
          if (match) setSelectedEmail(match);
        }
      } else {
        // Specific Category view (by categoryId)
        const data = await getCategoryEmailsApi({
          categoryId: activeNav,
          limit: 50,
          offset: 0,
          search: searchQuery,
          unread: isUnreadFilter,
        });

        const fetchedEmails = data.emails || [];
        setEmails(fetchedEmails);

        // Tag these emails with the active category in the client map
        const activeCatObj = categories.find((c) => String(c.id) === String(activeNav));
        if (activeCatObj) {
          setEmailCategoriesMap((prev) => {
            const next = { ...prev };
            fetchedEmails.forEach((email) => {
              const existing = next[email.id] || [];
              if (!existing.includes(activeCatObj.name)) {
                next[email.id] = [...existing, activeCatObj.name];
              }
            });
            return next;
          });

          setEmailCategoryIdsMap((prev) => {
            const next = { ...prev };
            fetchedEmails.forEach((email) => {
              const existing = next[email.id] || [];
              if (!existing.includes(Number(activeNav))) {
                next[email.id] = [...existing, Number(activeNav)];
              }
            });
            return next;
          });
        }

        // Auto-detect accountId if user doesn't have one set yet
        if (!accountId && fetchedEmails.length > 0 && fetchedEmails[0].email_account_id) {
          const discoveredId = String(fetchedEmails[0].email_account_id);
          setAccountId(discoveredId);
          localStorage.setItem(accountIdKey, discoveredId);
        }
      }
    } catch (err) {
      console.error("Failed to load emails:", err.message);
      setError(err.message || "Failed to load emails.");
    } finally {
      setLoadingEmails(false);
    }
  }, [activeNav, accountId, searchQuery, filter, categories, selectedEmail, accountIdKey]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Handle email row click: load full email details
  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);
    setLoadingDetail(true);

    try {
      const emailAccId = email.email_account_id || accountId;
      if (emailAccId) {
        const data = await getEmailDetailApi({
          accountId: emailAccId,
          emailId: email.id,
        });

        if (data.email) {
          setSelectedEmail(data.email);
        }
      }
    } catch (err) {
      console.warn("Could not fetch full email body, showing row preview:", err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle Mark as Read
  const handleMarkAsRead = async (emailId) => {
    const emailAccId = selectedEmail?.email_account_id || accountId;
    if (!emailAccId) return;

    setMarkingAsRead(true);
    try {
      await markEmailAsReadApi({
        accountId: emailAccId,
        emailId,
      });

      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, is_read: true } : e))
      );
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail((prev) => ({ ...prev, is_read: true }));
      }
      showToast("Email marked as read", "success");
    } catch (err) {
      showToast(err.message || "Failed to mark email as read", "error");
    } finally {
      setMarkingAsRead(false);
    }
  };

  // Handle Multi-Category Assignment
  const handleAssignCategory = async (emailId, categoryIds) => {
    try {
      const result = await assignCategoriesApi({
        emailId,
        categoryIds,
      });

      const newCategoryNames = categories
        .filter((c) => categoryIds.includes(Number(c.id)))
        .map((c) => c.name);

      setEmailCategoriesMap((prev) => ({
        ...prev,
        [emailId]: Array.from(new Set([...(prev[emailId] || []), ...newCategoryNames])),
      }));

      setEmailCategoryIdsMap((prev) => ({
        ...prev,
        [emailId]: Array.from(new Set([...(prev[emailId] || []), ...categoryIds.map(Number)])),
      }));

      showToast(result.message || "Categories assigned successfully", "success");
    } catch (err) {
      console.error("Assign categories failed:", err.message);
      showToast(err.message || "Failed to assign categories", "error");
    }
  };

  // Handle Removing a Category
  const handleRemoveCategory = async (emailId, catId) => {
    const cat = categories.find((c) => String(c.id) === String(catId));
    if (!cat) return;

    try {
      await removeCategoryApi({
        emailId,
        categoryId: catId,
      });

      setEmailCategoriesMap((prev) => ({
        ...prev,
        [emailId]: (prev[emailId] || []).filter((name) => name !== cat.name),
      }));

      setEmailCategoryIdsMap((prev) => ({
        ...prev,
        [emailId]: (prev[emailId] || []).filter((id) => String(id) !== String(catId)),
      }));

      showToast(`Removed "${cat.name}" category`, "info");
    } catch (err) {
      console.error("Remove category failed:", err.message);
      showToast(err.message || "Failed to remove category", "error");
    }
  };

  // Handle AI Classification
  const handleClassifyAI = async (emailId) => {
    setClassifyingAI(true);
    showToast("OpenRouter AI analyzing email content...", "info");

    try {
      const result = await classifyEmailAiApi(emailId);

      const returnedCategoryIds = result.categoryIds || [];
      const returnedNames = categories
        .filter((c) => returnedCategoryIds.includes(Number(c.id)))
        .map((c) => c.name);

      // Save returned AI reason
      if (result.reason) {
        setAiReasonsMap((prev) => ({
          ...prev,
          [emailId]: result.reason,
        }));
      }

      // Update email categories state
      setEmailCategoryIdsMap((prev) => ({
        ...prev,
        [emailId]: Array.from(new Set([...(prev[emailId] || []), ...returnedCategoryIds])),
      }));

      setEmailCategoriesMap((prev) => ({
        ...prev,
        [emailId]: Array.from(new Set([...(prev[emailId] || []), ...returnedNames])),
      }));

      const catLabel = returnedNames.join(", ") || "categorized";
      showToast(`AI Classified as: ${catLabel}`, "success");
    } catch (err) {
      console.error("AI classification error:", err.message);
      showToast(err.message || "AI classification failed. Please try again.", "error");
    } finally {
      setClassifyingAI(false);
    }
  };

  // Handle Gmail Sync
  const handleTriggerSync = async () => {
    if (!accountId) {
      setIsGmailModalOpen(true);
      showToast("Connect your Gmail account first to sync emails", "info");
      return;
    }

    setSyncing(true);
    showToast("Syncing latest emails from Gmail...", "info");

    try {
      const result = await syncGmailAccountApi(accountId);

      const msg = `Sync complete: ${result.fetchedCount ?? 0} fetched, ${result.insertedCount ?? 0} new inserted, ${result.classifiedCount ?? 0} classified.`;
      showToast(msg, "success");

      // Refresh email list
      await fetchEmails();
    } catch (err) {
      console.error("Gmail sync failed:", err.message);
      showToast(err.message || "Failed to sync Gmail messages.", "error");
    } finally {
      setSyncing(false);
    }
  };

  // Handle Category Creation
  const handleCreateCategory = async (name) => {
    try {
      const result = await createCategoryApi(name);
      if (result.category) {
        setCategories((prev) => [...prev, result.category]);
        setIsCategoryModalOpen(false);
        showToast(result.message || `Category "${name}" created!`, "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to create category", "error");
    }
  };

  // Handle saving connected account
  const handleSaveAccount = (newAccountId, newEmail) => {
    setAccountId(newAccountId);
    localStorage.setItem(accountIdKey, newAccountId);

    if (newEmail) {
      setConnectedEmail(newEmail);
      localStorage.setItem(emailAddressKey, newEmail);
    }

    setIsGmailModalOpen(false);
    showToast(`Gmail account (ID: ${newAccountId}) connected!`, "success");
  };

  // Handle disconnect
  const handleDisconnect = () => {
    setAccountId(null);
    setConnectedEmail(null);
    localStorage.removeItem(accountIdKey);
    localStorage.removeItem(emailAddressKey);
    setIsGmailModalOpen(false);
    setEmails([]);
    setSelectedEmail(null);
    showToast("Gmail account disconnected", "info");
  };

  // Filter emails for Important pill
  const importantCat = categories.find(
    (c) => c.name.toLowerCase() === "important"
  );

  const displayedEmails =
    filter === "important" && importantCat
      ? emails.filter((email) => {
          const cats = emailCategoriesMap[email.id] || [];
          return cats.some((c) => c.toLowerCase() === "important");
        })
      : emails;

  // Header Title
  const activeCategoryObj =
    activeNav === "all"
      ? null
      : categories.find((c) => String(c.id) === String(activeNav));
  const pageTitle = activeCategoryObj ? activeCategoryObj.name : "All Emails";

  return (
    <DashboardLayout
      sidebarProps={{
        categories,
        activeNav,
        onSelectNav: (navId) => {
          setActiveNav(navId);
          setSelectedEmail(null);
        },
        onSync: handleTriggerSync,
        syncing,
        onOpenAddCategory: () => setIsCategoryModalOpen(true),
        unreadCount: emails.filter((e) => !e.is_read).length,
        user: user || { name: "User", email: "user@example.com" },
        onLogout: logout,
        onOpenSettings: () => setIsGmailModalOpen(true),
      }}
      headerProps={{
        title: pageTitle,
        emailCount: displayedEmails.length,
        searchQuery,
        onSearchChange: setSearchQuery,
        onClearSearch: () => setSearchQuery(""),
        connectedEmail,
        onOpenGmailConnect: () => setIsGmailModalOpen(true),
      }}
    >
      {/* Middle Column: Compact Email List */}
      <EmailList
        emails={displayedEmails}
        selectedEmail={selectedEmail}
        onSelectEmail={handleSelectEmail}
        loading={loadingEmails}
        error={error}
        onRefresh={handleTriggerSync}
        filter={filter}
        onFilterChange={setFilter}
        emailCategoriesMap={emailCategoriesMap}
        importantCategoryId={importantCat?.id}
        onOpenGmailConnect={() => setIsGmailModalOpen(true)}
        hasConnectedAccount={Boolean(accountId)}
      />

      {/* Right Column: Large Email Reading Panel */}
      <EmailDetailPanel
        email={selectedEmail}
        loading={loadingDetail}
        onMarkAsRead={handleMarkAsRead}
        markingAsRead={markingAsRead}
        onClassifyAI={handleClassifyAI}
        classifyingAI={classifyingAI}
        allCategories={categories}
        assignedCategoryIds={
          selectedEmail ? emailCategoryIdsMap[selectedEmail.id] || [] : []
        }
        onAssignCategory={handleAssignCategory}
        onRemoveCategory={handleRemoveCategory}
        onClose={() => setSelectedEmail(null)}
        aiReason={selectedEmail ? aiReasonsMap[selectedEmail.id] || "" : ""}
      />

      {/* Category Creation Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreate={handleCreateCategory}
      />

      {/* Gmail Connection & Sync Modal */}
      <ConnectGmailModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        connectedEmail={connectedEmail}
        accountId={accountId}
        onSaveAccount={handleSaveAccount}
        onDisconnect={handleDisconnect}
        onSync={handleTriggerSync}
        syncing={syncing}
      />

      {/* Notifications Toast */}
      {toast && (
        <div className="toast-container" role="status" aria-live="polite">
          <div className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
