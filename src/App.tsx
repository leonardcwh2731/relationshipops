// inside App.tsx (only showing fetchContacts and helper)
const PAGE_SIZE = 1000;

async function fetchAllPages(
  table: string,
  column: string,
  value: string
): Promise<Contact[]> {
  let all: Contact[] = [];
  let from = 0;
  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from<Contact>(table)
      .select('*')
      .eq(column, value)
      .order('last_interaction_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(`Paging error on ${column}=${value}`, error);
      break;
    }
    if (!data || data.length === 0) break;

    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;  // last page
    from += PAGE_SIZE;
  }
  return all;
}

const fetchContacts = async () => {
  try {
    setLoading(true);
    setError(null);

    const clientEmail = 'leonard@ontenlabs.com';

    // 1) get exact count
    const { count: totalCount, error: countError } = await supabase
      .from('icp_contacts_tracking_in_progress')
      .select('*', { count: 'exact', head: true })
      .eq('client_email', clientEmail);

    // 2) page through client_email
    const allContacts = await fetchAllPages(
      'icp_contacts_tracking_in_progress',
      'client_email',
      clientEmail
    );

    // 3) page through client_email_id
    const contactsByEmailId = await fetchAllPages(
      'icp_contacts_tracking_in_progress',
      'client_email_id',
      clientEmail
    );

    setDebugInfo({
      totalCount,
      allContactsCount: allContacts.length,
      contactsByEmailIdCount: contactsByEmailId.length,
      countError,
      sampleContact: allContacts[0] || null,
    });

    // pick the larger result set
    const contactsData =
      allContacts.length >= contactsByEmailId.length
        ? allContacts
        : contactsByEmailId;

    if (contactsData.length === 0) {
      setError('No contacts found');
    } else {
      setContacts(contactsData);
      setTotalContacts(contactsData.length);

      const uniqueCompanies = new Set(
        contactsData.map((c) => c.company_domain || c.company_name)
      ).size;
      setTotalGroups(uniqueCompanies);

      const above80 = contactsData.filter(
        (c) => (c.total_lead_score || c.lead_score || 0) >= 80
      ).length;
      setLeadsAbove80(above80);

      const ready = contactsData.filter((c) =>
        ['Yes', 'yes'].includes(c.sent_to_client)
      ).length;
      setReadyToSendContacts(ready);
    }
  } catch (err) {
    console.error('Error fetching contacts:', err);
    setError('Failed to fetch contacts');
  } finally {
    setLoading(false);
  }
};
